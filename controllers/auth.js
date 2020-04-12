const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

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