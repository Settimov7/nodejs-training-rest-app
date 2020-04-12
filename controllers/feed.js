const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (request, response, next) => {
	Post.find()
	.then((posts) => {
		response.status(200).json({
			message: 'Fetched posts successfully.',
			posts,
		});
	})
	.catch((error) => {
		next(error);
	})
};

exports.createPost = (request, response, next) => {
	const { title, content } = request.body;
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect');
		error.statusCode = 422;

		throw error;
	}

	const post = Post({
		title,
		imageUrl: 'images/image.jpg',
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