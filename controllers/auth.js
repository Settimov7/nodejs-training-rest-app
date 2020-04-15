const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const User = require('../models/user');

dotenv.config();

exports.signup = async (request, response, next) => {
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;
		error.data = errors.array();

		throw error;
	}

	const { email, name, password } = request.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email,
			password: hashedPassword,
			name,
		});

		await user.save();

		response.status(201).json({
			message: 'User created!',
			userId: user._id,
		});
	} catch (error) {
		next(error);
	}
};

exports.login = async (request, response, next) => {
	const { email, password } = request.body;

	try {
		const user = await User.findOne({ email });

		if (!user) {
			const error = new Error('A user with this email could not be found.');
			error.statusCode = 401;

			return next(error);
		}

		const isEqual = await bcrypt.compare(password, user.password);

		if (!isEqual) {
			const error = new Error('Wrong password.');
			error.statusCode = 401;

			return next(error);
		}

		const userId = user._id.toString();
		const token = jwt.sign(
			{
				email: user.email,
				userId: user._id,
			},
			process.env.SECRET_KEY,
			{
				expiresIn: '1h',
			},
		);

		response.status(200).json({ token, userId })
	} catch (error) {
		next(error);
	}
};

exports.getUserStatus = async (request, response, next) => {
	const { userId } = request;

	try {
		const user = await User.findById(userId);

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;

			return next(error);
		}

		response.status(200).json({
			status: user.status,
		});
	} catch (error) {
		next(error);
	}
};

exports.updateUserStatus = async (request, response, next) => {
	const { userId, body } = request;
	const { status } = body;

	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;
		error.data = errors.array();

		throw error;
	}

	try {
		const user = await User.findById(userId);

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;

			return next(error);
		}

		user.status = status;

		await user.save();

		response.status(200).json({
			message: 'Status updated.',
			status,
		});
	} catch (error) {
		next(error);
	}
};