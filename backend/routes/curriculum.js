import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Scrapers
import grades from '../scrapers/userhistory';
import curriculum from '../scrapers/curriculum';

// Models
import Curriculum from '../models/Curriculum';

const router = express.Router();

router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: false }));


function doParseAndSaveCurriculum(filename) {
	return new Promise((resolve, reject) => {
		var filepath = path.join(__dirname, '../samples/curriculum/' + filename + '.html');

		fs.readFile(filepath, async function (error, pgResp) {
			if (error) {
				console.log(error);
			} else {
				var resp = await curriculum.parseCurriculum(pgResp);

				var data = {
					reg_prefix: filename,
					pc: resp.pc,
					uc: resp.uc,
					pe: resp.pe,
					ue: resp.ue,
					bridge: resp.bridge,
					todo_creds: resp.todo_creds,
				};

				Curriculum.findOneAndUpdate({ reg_prefix: filename }, data, { upsert: true, new: true },
					function (err, doc) {
						if (err) return reject(err);
						return resolve(doc);
					});
			}
		});
	});
}

router.get('/testCurriculum', (req, res, next) => {
	var currs = ['17BCI', '17BCE'];
	var actions = currs.map(doParseAndSaveCurriculum);
	var results = Promise.all(actions);

	results.then(data => res.send(data))
	.catch(err => console.log(err));
});

router.get('/getPrefixes', (req, res, next) => {
	Curriculum.aggregate(
		[{
			$project: {
				reg_prefix: 1,
				_id: 0
			}
		}, {
			$sort: {
				reg_prefix: 1
			}
		}], function(err, data) {
			if(err) console.log(err);
			else {
				data = data.map((dat) => dat.reg_prefix);
				res.send(data);
			}
		}
	);
});

module.exports = router;