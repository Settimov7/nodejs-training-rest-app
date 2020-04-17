const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports = {
	hello: () => {
		return 'Hello World!'
	},
	createUser: async ({ userInput }, request) => {
		const { email, name, password } = userInput;
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