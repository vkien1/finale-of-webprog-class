const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post'); // Ensure this is correctly pointing to your Post model
const router = express.Router();

// Middleware for authentication
function auth(req, res, next) {
    if (!req.session.userId) {
        // Render the error page directly without passing a custom message
        return res.status(401).render('error');
    }
    next();
}
// Dashboard (only for logged-in users)
router.get('/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const posts = await Post.find({ author: user._id }); // Fetch posts created by this user
        res.render('dashboard', { user, posts });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});


// Create Post
router.post('/create', auth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    const post = new Post({ title: req.body.title, content: req.body.content, author: user._id });
    await post.save();
    res.redirect('/posts/dashboard');
});

// Update Post
router.post('/edit/:id', auth, async (req, res) => {
    const { title, content } = req.body;
    await Post.findByIdAndUpdate(req.params.id, { title, content });
    res.redirect('/posts/dashboard');
});

// Delete Post
router.get('/delete/:id', auth, async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/posts/dashboard');
});

module.exports = router;
