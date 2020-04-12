exports.getPosts = (request, response) => {
	response.status(200).json({
		posts: [
			{
				title: 'First Post',
				content: 'This is the first post!',
			},
			{
				title: 'Second Post',
				content: 'This is the second post!',
			},
			{
				title: 'Third Post',
				content: 'This is the third post!',
			},
		]
	})
};

exports.createPost = (request, response) => {
	const { title, content } = request.body;

	response.status(201).json({
		message: 'Post created successfully',
		post: {
			id: new Date().toISOString(),
			title,
			content,
		}
	});
};