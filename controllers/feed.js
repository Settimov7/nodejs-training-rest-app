const { validationResult } = require('express-validator/check');

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

	response.status(201).json({
		message: 'Post created successfully',
		post: {
			id: new Date().toISOString(),
			title,
			content,
			creator: {
				name: 'Name',
			},
			createdAt: new Date(),
		}
	});
};