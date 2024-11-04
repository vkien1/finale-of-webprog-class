// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User'); // Import User model
const ensureAuthenticated = require('../middleware/authMiddleware'); // Import the middleware

// Front page route: displays all posts, protected by the middleware
router.get('/frontpage', ensureAuthenticated, async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate('author', 'username') // Populate only the username of the author
            .sort({ createdAt: -1 });
        
        // Retrieve the user object based on the session userId
        const user = await User.findById(req.session.userId);

        // Render the frontpage with both posts and the user object
        res.render('frontpage', { posts, user });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Display posts and create form for "School" community
router.get('/school', ensureAuthenticated, async (req, res) => {
    try {
        const posts = await Post.find({ community: 'school' })
            .populate('author', 'username') // Populate only the username of the author
            .sort({ createdAt: -1 });
        const user = await User.findById(req.session.userId);
        res.render('communities/school', { posts, user });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// Route to create a new post for "School" community
router.post('/school/create-post', ensureAuthenticated, async (req, res) => {
    try {
        const { title, content } = req.body;
        const user = await User.findById(req.session.userId);

        const newPost = new Post({
            title,
            content,
            author: user._id, // Store the user ID as the author
            community: 'school', // Indicate this post belongs to the "School" community
            createdAt: new Date()
        });
        await newPost.save();
        res.redirect('/posts/school'); // Redirect back to the School community page
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating post");
    }
});

module.exports = router;
