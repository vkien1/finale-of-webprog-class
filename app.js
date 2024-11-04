require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const path = require('path');
const ensureAuthenticated = require('./middleware/authMiddleware'); // Import the middleware

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { secure: false, maxAge: 1000 * 60 * 60 } // 1 hour
}));

// Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
app.use('/', authRoutes);  // Mount auth routes at root level
app.use('/posts', ensureAuthenticated, postRoutes);  // Protect all post routes

// Home route: Redirect to frontpage if logged in, otherwise render welcome.ejs
app.get('/', (req, res) => {
    if (req.session.userId) {
        // If user is logged in, redirect to frontpage
        res.redirect('/posts/frontpage');
    } else {
        // If not logged in, render the welcome page
        res.render('index.ejs');
    }
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
