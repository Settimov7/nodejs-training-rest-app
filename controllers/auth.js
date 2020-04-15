const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const User = require('../models/user');

dotenv.config();

exports.signup = (request, response, next) => {
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;
		error.data = errors.array();

		throw error;
	}

	const { email, name, password } = request.body;

	bcrypt.hash(password, 12)
	.then((password) => {
		const user = new User({
			email,
			password,
			name,
		});

		return user.save();
	})
	.then((user) => {
		response.status(201).json({
			message: 'User created!',
			userId: user._id,
		});
	})
	.catch((error) => {
		next(error);
	})
};

exports.login = (request, response, next) => {
	const { email, password } = request.body;
	let currentUser;

	User.findOne({ email })
	.then((user) => {
		if (!user) {
			const error = new Error('A user with this email could not be found.');
			error.statusCode = 401;

			throw error;
		}

		currentUser = user;

		return bcrypt.compare(password, user.password);
	})
	.then((isEqual) => {
		if (!isEqual) {
			const error = new Error('Wrong password.');
			error.statusCode = 401;

			throw error;
		}

		const { _id, email } = currentUser;
		const userId = _id.toString();
		const token = jwt.sign(
			{
				email,
				userId,
			},
			process.env.SECRET_KEY,
			{
				expiresIn: '1h',
			},
		);

		response.status(200).json({ token, userId })
	})
	.catch((error) => {
		next(error);
	})
};

exports.getUserStatus = (request, response, next) => {
	const { userId } = request;

	User.findById(userId)
	.then((user) => {
		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;

			throw error;
		}

		response.status(200).json({
			status: user.status,
		});
	})
	.catch((error) => {
		next(error);
	})
};

exports.updateUserStatus =(request, response, next) => {
	const { userId, body } = request;
	const { status } = body;

	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;
		error.data = errors.array();

		throw error;
	}

	User.findById(userId)
	.then((user) => {
		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;

			throw error;
		}

		user.status = status;

		return user.save();
	})
	.then(() => {
		response.status(200).json({
			message: 'Status updated.',
			status,
		});
	})
	.catch((error) => {
		next(error);
	})
};