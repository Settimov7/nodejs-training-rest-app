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

exports.createPost = (request, response) => {
	const { title, content } = request.body;
	const errors = validationResult(request);

	if(!errors.isEmpty()) {
		return response.status(422).json({
			message: 'Validation failed, entered data is incorrect',
			errors: errors.array(),
		})
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
		console.log(error);
	});
};