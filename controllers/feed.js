const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (request, response, next) => {
	const { page = 1 } = request.query;
	const perPage = 2;
	let totalItems;

	Post.find().countDocuments()
	.then((count) => {
		totalItems = count;

		return Post.find()
		.skip((page - 1) * perPage)
		.limit(perPage);
	})
	.then((posts) => {
		response.status(200).json({
			message: 'Fetched posts successfully.',
			posts,
			totalItems,
		});
	})
	.catch((error) => {
		next(error);
	});
};

exports.createPost = (request, response, next) => {
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
	const { file } = request;
	const imageUrl = file.path.replace('\\', '/');

	const post = Post({
		title,
		imageUrl,
		content,
		creator: {
			name: 'Name',
		},
	});

	post.save()
	.then((post) => {
		response.status(201).json({
			message: 'Post created successfully',
			post,
		});
	})
	.catch((error) => {
		next(error);
	});
};

exports.getPost = (request, response, next) => {
	const { postId } = request.params;

	Post.findById(postId)
	.then((post) => {
		if (!post) {
			const error = new Error('Could not find post!');
			error.status(404);

			throw error;
		}

		response.status(200).json({
			message: 'Post fetched.',
			post,
		});
	})
	.catch((error) => {
		next(error);
	});
};

exports.updatePost = (request, response, next) => {
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect.');
		error.statusCode = 422;

		throw error;
	}

	const { params, body, file } = request;
	const { postId } = params;
	const { title, content, image } = body;
	let imageUrl = image;

	if (request.file) {
		imageUrl = file.path.replace('\\', '/');
	}

	if (!imageUrl) {
		const error = new Error('No file picked.');
		error.statusCode = 422;

		throw error;
	}

	Post.findById(postId)
	.then((post) => {
		if (!post) {
			const error = new Error('Could not find post!');
			error.status(404);

			throw error;
		}

		if (imageUrl !== post.imageUrl) {
			clearImage(post.imageUrl);
		}

		post.title = title;
		post.imageUrl = imageUrl;
		post.content = content;

		return post.save();
	})
	.then((post) => {
		response.status(200).json({
			message: 'Post updated!',
			post,
		})
	})
	.catch((error) => {
		next(error);
	});
};

exports.deletePost = (request, response, next) => {
	const { postId } = request.params;

	Post.findById(postId)
	.then((post) => {
		if (!post) {
			const error = new Error('Could not find post!');
			error.status(404);

			throw error;
		}

		clearImage(post.imageUrl);

		return Post.findByIdAndRemove(postId);
	})
	.then(() => {
		response.status(200).json({
			message: 'Deleted post.'
		})
	})
	.catch((error) => {
		next(error);
	})
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (error) => {
		console.log(error);
	})
};