const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user');
const io = require('../socket');

exports.getPosts = async (request, response, next) => {
	const { page = 1 } = request.query;
	const perPage = 2;

	try {
		const count = await Post.find().countDocuments();
		const posts = await Post.find().populate('creator').skip((page - 1) * perPage).limit(perPage);

		response.status(200).json({
			message: 'Fetched posts successfully.',
			posts,
			count,
		});
	} catch (error) {
		next(error);
	}
};

exports.createPost = async (request, response, next) => {
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;

		throw error;
	}

	if (!request.file) {
		const error = new Error('No image provided.');
		error.statusCode = 422;

		throw error;
	}

	const { title, content } = request.body;
	const { file, userId } = request;
	const imageUrl = file.path.replace('\\', '/');
	const post = Post({
		title,
		imageUrl,
		content,
		creator: userId,
	});

	try {
		await post.save();

		const user = await User.findById(userId);

		user.posts.push(post);
		await user.save();

		io.getIO().emit('posts', {
			action: 'create',
			post: {
				...post._doc,
				creator: {
					_id: userId,
					name: user.name,
				},
			},
		});

		response.status(201).json({
			message: 'Post created successfully',
			post,
			creator: {
				_id: user._id,
				name: user.name,
			},
		});
	} catch (error) {
		next(error);
	}
};

exports.getPost = async (request, response, next) => {
	const { postId } = request.params;

	try {
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('Could not find post!');
			error.status(404);

			return next(error);
		}

		response.status(200).json({
			message: 'Post fetched.',
			post,
		});
	} catch (error) {
		next(error);
	}
};

exports.updatePost = async (request, response, next) => {
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;

		throw error;
	}

	const { params, body, file } = request;
	const { postId } = params;
	const { title, content, image } = body;
	const imageUrl = request.file ? file.path.replace('\\', '/') : image;

	if (!imageUrl) {
		const error = new Error('No file picked.');
		error.statusCode = 422;

		throw error;
	}

	try {
		const post = await Post.findById(postId).populate('creator');

		if (!post) {
			const error = new Error('Could not find post!');
			error.status(404);

			return next(error);
		}

		if (post.creator._id.toString() !== request.userId) {
			const error = new Error('Not authorized!');
			error.statusCode = 403;

			return next(error);
		}

		if (imageUrl !== post.imageUrl) {
			clearImage(post.imageUrl);
		}

		post.title = title;
		post.imageUrl = imageUrl;
		post.content = content;

		const result = await post.save();

		io.getIO().emit('posts', {
			action: 'update',
			post: result,
		});

		response.status(200).json({
			message: 'Post updated!',
			post,
		})
	} catch (error) {
		next(error);
	}
};

exports.deletePost = async (request, response, next) => {
	const { postId } = request.params;

	try {
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('Could not find post!');
			error.status(404);

			return next(error);
		}

		if (post.creator.toString() !== request.userId) {
			const error = new Error('Not authorized!');
			error.statusCode = 403;

			return next(error);
		}

		clearImage(post.imageUrl);

		await Post.findByIdAndRemove(postId);

		const user = await User.findById(request.userId);

		user.posts.pull(postId);

		await user.save();

		response.status(200).json({
			message: 'Deleted post.'
		})
	} catch (error) {
		next(error);
	}
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (error) => {
		console.log(error);
	})
};