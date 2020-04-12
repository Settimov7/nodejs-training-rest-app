const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (request, response) => {
	response.status(200).json({
		posts: [
			{
				_id: 'id',
				title: 'First Post',
				content: 'This is the first post!',
				imageUrl: 'images/image.jpg',
				creator: {
					name: 'Name',
				},
				createdAt: new Date(),
			},
		]
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