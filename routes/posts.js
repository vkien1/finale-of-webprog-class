const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const ensureAuthenticated = require('../middleware/authMiddleware');

// General route to display posts for any community
router.get('/:community', ensureAuthenticated, async (req, res) => {
    const communityName = req.params.community;

    try {
        const posts = await Post.find({ community: communityName })
            .populate('author', 'username')
            .sort({ createdAt: -1 });
        
        const user = await User.findById(req.session.userId);
        res.render(`communities/${communityName}`, { posts, user, community: communityName });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
});

// General route to create a new post in any community
router.post('/:community/create-post', ensureAuthenticated, async (req, res) => {
    const communityName = req.params.community;
    const { title, content } = req.body;

    try {
        const user = await User.findById(req.session.userId);
        const newPost = new Post({
            title,
            content,
            author: user._id,
            community: communityName,
            createdAt: new Date(),
        });
        
        await newPost.save();
        res.redirect(`/posts/${communityName}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating post");
    }
});

// DELETE route to delete a post
router.delete('/:community/delete/:id', ensureAuthenticated, async (req, res) => {
    const communityName = req.params.community;

    try {
        await Post.findByIdAndDelete(req.params.id);
        res.redirect(`/posts/${communityName}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting post");
    }
});

// PUT route to handle inline editing of posts
router.put('/:community/edit/:id', ensureAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    const communityName = req.params.community;

    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        const user = await User.findById(req.session.userId);
        if (!user || !post.author.equals(user._id)) {
            return res.status(403).send("Unauthorized");
        }

        // Update the post with new data
        post.title = title;
        post.content = content;
        await post.save();

        res.redirect(`/posts/${communityName}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating post");
    }
});

module.exports = router;
