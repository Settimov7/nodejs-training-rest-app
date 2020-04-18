const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const User = require('../models/user');
const Post = require('../models/post');

const { clearImage } = require('../util/file');

dotenv.config();

module.exports = {
	createUser: async ({ userInput }) => {
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

		const userId = user._id.toString();
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
	},

	createPost: async ({ postInput }, request) => {
		if (!request.isAuth) {
			const error = new Error('Not authenticated!');

			error.code = 401;

			throw error;
		}

		const { title, content, imageUrl } = postInput;
		const errors = [];

		if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
			errors.push({
				message: 'Title too short!',
			});
		}

		if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
			errors.push({
				message: 'Content too short!',
			});
		}

		if (errors.length > 0) {
			const error = new Error('Invalid input.');

			error.data = errors;
			error.code = 422;

			throw error;
		}

		const user = await User.findById(request.userId);

		if (!user) {
			const error = new Error('Invalid user.');

			error.code = 401;

			throw error;
		}

		const post = new Post({
			title,
			content,
			imageUrl,
			creator: user,
		});

		const createdPost = await post.save();

		user.posts.push(createdPost);

		await user.save();

		return {
			...createdPost._doc,
			_id: createdPost._id.toString(),
			createdAt: createdPost.createdAt.toISOString(),
			updatedAt: createdPost.updatedAt.toISOString(),
		}
	},

	posts: async ({ page }, request) => {
		if (!request.isAuth) {
			const error = new Error('Not authenticated!');

			error.code = 401;

			throw error;
		}

		if (!page) {
			page = 1;
		}

		const perPage = 2;
		const totalPosts = await Post.find().countDocuments();
		const posts = await Post.find()
		.sort({ createdAt: -1 })
		.skip((page - 1) * perPage)
		.limit(perPage)
		.populate('creator');

		return {
			posts: posts.map((post) => ({
				...post._doc,
				_id: post._id.toString(),
				createdAt: post.createdAt.toISOString(),
				updatedAt: post.updatedAt.toISOString(),
			})),
			totalPosts,
		}
	},

	post: async ({ id }, request) => {
		if (!request.isAuth) {
			const error = new Error('Not authenticated!');

			error.code = 401;

			throw error;
		}

		const post = await Post.findById(id).populate('creator');

		if (!post) {
			const error = new Error('No post found');

			error.code = 404;

			throw error;
		}

		return {
			...post._doc,
			_id: post._id.toString(),
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
		}
	},

	updatePost: async ({ id, postInput }, request) => {
		if (!request.isAuth) {
			const error = new Error('Not authenticated!');

			error.code = 401;

			throw error;
		}

		const post = await Post.findById(id).populate('creator');

		if (!post) {
			const error = new Error('No post found');

			error.code = 404;

			throw error;
		}

		if (post.creator._id.toString() !== request.userId.toString()) {
			const error = new Error('Not authenticated!');

			error.code = 403;

			throw error;
		}

		const { title, content, imageUrl } = postInput;
		const errors = [];

		if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
			errors.push({
				message: 'Title too short!',
			});
		}

		if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
			errors.push({
				message: 'Content too short!',
			});
		}

		if (errors.length > 0) {
			const error = new Error('Invalid input.');

			error.data = errors;
			error.code = 422;

			throw error;
		}

		post.title = title;
		post.content = content;

		if (imageUrl !== 'undefined') {
			post.imageUrl = imageUrl;
		}

		const updatedPost = await post.save();

		return {
			...updatedPost._doc,
			_id: updatedPost._id.toString(),
			createdAt: updatedPost.createdAt.toISOString(),
			updatedAt: updatedPost.updatedAt.toISOString(),
		}
	},

	deletePost: async ({ id }, request) => {
		if (!request.isAuth) {
			const error = new Error('Not authenticated!');

			error.code = 401;

			throw error;
		}

		const post = await Post.findById(id);

		if (!post) {
			const error = new Error('No post found');

			error.code = 404;

			throw error;
		}

		if (post.creator.toString() !== request.userId.toString()) {
			const error = new Error('Not authenticated!');

			error.code = 403;

			throw error;
		}

		clearImage(post.imageUrl);

		await Post.findByIdAndRemove(id);

		const user = await User.findById(request.userId);

		user.posts.pull(id);

		await user.save();

		return true
	},

	user: async (_, request) => {
		if (!request.isAuth) {
			const error = new Error('Not authenticated!');

			error.code = 401;

			throw error;
		}

		const user = await User.findById(request.userId);

		if (!user) {
			const error = new Error('No user found');

			error.code = 404;

			throw error;
		}

		return {
			...user._doc,
			_id: user._id.toString(),
		}
	},
}