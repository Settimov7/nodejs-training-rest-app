const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user');

module.exports = {
	hello: () => {
		return 'Hello World!'
	},
	createUser: async ({ userInput }, request) => {
		const { email, name, password } = userInput;
		const errors = [];

		if (!validator.isEmail(email)) {
			errors.push({
				message: 'Email is invalid',
			});
		}

		if (validator.isEmpty(password) || validator.isLength(password, { min: 5 })) {
			errors.push({
				message: 'Password too short!',
			});
		}

		if (errors.length > 0) {
			throw new Error('Invalid input.')
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
}