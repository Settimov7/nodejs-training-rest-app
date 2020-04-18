const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const uuidv4 = require('uuid/v4')
const graphqlHttp = require('express-graphql');

const graphQLSchema = require('./graphql/schema');
const graphQLResolver = require('./graphql/resolvers');

const fileStorage = multer.diskStorage({
	destination: (request, file, callback) => {
		callback(null, 'images');
	},
	filename: (request, file, callback) => {
		callback(null, `${ uuidv4() }-${ file.originalname }`);
	},
});

const fileFilter = (request, file, callback) => {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
		callback(null, true);
	}

	callback(null, false);
};

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use(multer({
	storage: fileStorage,
	fileFilter,
}).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((request, response, next) => {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (request.method === 'OPTIONS') {
		return response.sendStatus(200);
	}

	next();
});

app.use('/graphql', graphqlHttp({
	schema: graphQLSchema,
	rootValue: graphQLResolver,
	graphiql: true,
	formatError: (error) => {
		if (!error.originalError) {
			return error;
		}

		const data = error.originalError.data;
		const message = error.message || 'An error occurred';
		const code = error.originalError.code || 500;

		return {
			message,
			status: code,
			data,
		}
	},
}));

app.use((error, request, response, next) => {
	console.log(error);

	const { statusCode = 500, message, data } = error;

	response.status(statusCode).json({
		message,
		data,
	})
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
	app.listen(8080);
})
.catch((error) => {
	console.log(error);
});