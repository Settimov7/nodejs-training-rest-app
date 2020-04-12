const { Router } = require('express');

const feedController = require('../controllers/feed');

const router = Router();

router.get('/posts', feedController.getPosts);

router.post('/post', feedController.createPost);

module.exports = router;