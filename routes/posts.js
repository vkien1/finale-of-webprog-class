// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User'); // Import User model
const ensureAuthenticated = require('../middleware/authMiddleware'); // Import the middleware

// Front page route: displays all posts, protected by the middleware
router.get('/frontpage', ensureAuthenticated, async (req, res) => {
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 });
        
        // Retrieve the user object based on the session userId
        const user = await User.findById(req.session.userId);

        // Render the frontpage with both posts and the user object
        res.render('frontpage', { posts, user });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Route to create a new post, protected by middleware
router.post('/create', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content } = req.body;

        // Retrieve the user from the session to access username
        const user = await User.findById(req.session.userId);

        const newPost = new Post({
            title,
            content,
            author: user.username, // Store the username as the author of the post
            createdAt: new Date()
        });
        await newPost.save();
        res.redirect('/posts/frontpage');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating post");
    }
});

module.exports = router;
