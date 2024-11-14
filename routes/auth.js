const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Register
router.get('/register', (req, res) => res.render('register'));
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email, password });
        await user.save();
        req.session.userId = user._id;
        res.redirect('/posts/frontpage'); // Redirect to front page after registration
    } catch (err) {
        res.redirect('/register');
    }
});

// Login
router.get('/login', (req, res) => res.render('login'));
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await user.comparePassword(password)) {
        req.session.userId = user._id;
        res.redirect('/posts/frontpage'); // Redirect to front page after login
    } else {
        res.redirect('/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/posts/frontpage'); // Redirect to front page if there's an error on logout
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Contact Page
router.get('/contact', (req, res) => {
    res.render('contact');
});

// Contact Form Submission
router.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Contact form submitted by ${name} (${email}): ${message}`);
    res.send('Thank you for your message!');
});

module.exports = router;
