const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const User = require('../models/user');

dotenv.config();

module.exports = {
	createUser: async ({ userInput }, request) => {
		const { email, name, password } = userInput;
		const errors = [];

		if (!validator.isEmail(email)) {
			errors.push({
				message: 'Email is invalid',
			});
		}

		if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
			errors.push({
				message: 'Password too short!',
			});
		}

		if (errors.length > 0) {
			const error = new Error('Invalid input.');

			error.data = errors;
			error.code = 422;

			throw error;
		}

		const existingUser = await User.findOne({ email });

		if (existingUser) {
			throw new Error('User existing already!');
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email,
			name,
			password: hashedPassword,
		});
		const createdUser = await user.save();

		return {
			...createdUser._doc,
			_id: createdUser._id.toString(),
		}
	},

	login: async ({ email, password }) => {
		const user = await User.findOne({ email });

		if (!user) {
			const error = new Error('User not found.');
			error.code = 401;

			throw error;
		}

		const isEqual = await bcrypt.compare(password, user.password);

		if (!isEqual) {
			const error = new Error('Password is incorrect.');
			error.code = 401;

			throw error;
		}

		const userId =  user._id.toString();
		const token = jwt.sign(
			{
				email: user.email,
				userId,
			},
			process.env.SECRET_KEY,
			{
				expiresIn: '1h',
			},
		);

		return {
			token,
			userId,
		}
	}
}