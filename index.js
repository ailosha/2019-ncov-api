const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const apicache = require('apicache');
const compression = require('compression');
const Scraper = require('./services/Scraper');
const Twitter = require('./services/Twitter');

const PORT = process.env.PORT;

const app = express();
const cache = apicache.middleware;
app.use(
	cors({
		origin: process.env.CORS_ORIGIN
	})
);
app.use(compression());
// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
	path.join(__dirname, 'access.log'),
	{ flags: 'a' }
);

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/api/cases', async (req, res) => {
	if (fs.existsSync('./data.json')) {
		const data = JSON.parse(await fs.promises.readFile('./data.json', 'utf8'));
		return res.json(data);
	}

	const scraper = new Scraper();
	const data = await scraper.fetchTimeSeries();
	await fs.promises.writeFile('./data.json', JSON.stringify(data));
	return res.json(data);
});

app.get('/api/tweets', async (req, res) => {
	const twit = new Twitter();
	const data = await twit.getTweets(req.query);
	return res.json(data);
});

app.get('/api/timeline', cache('5 hours'), async (req, res) => {
	const scraper = new Scraper();
	const data = await scraper.getTimeline();
	return res.json(data);
});

app.get('*', (req, res) => res.send('Page Not found'));

app.listen(PORT, () => {
	console.log(`App listening on port ${PORT}!`);
});
