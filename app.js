const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');

const app = express();
dotenv.config();

app.use(bodyParser.json());

app.use((request, response, next) => {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	next();
});

app.use('/feed', feedRoutes);

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
	app.listen(8080);
})
.catch((error) => {
	console.log(error);
});