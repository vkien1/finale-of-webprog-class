require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs'); // For checking if a community template exists
const ensureAuthenticated = require('./middleware/authMiddleware');
const methodOverride = require('method-override');
const Post = require('./models/Post'); // Import the Post model
const User = require('./models/User'); // Import the User model

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

app.use(methodOverride('_method'));

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

// Home route: Redirect to frontpage if logged in, otherwise render index.ejs
app.get('/', (req, res) => {
    if (req.session.userId) {
        // If user is logged in, redirect to frontpage
        res.redirect('/posts/frontpage');
    } else {
        // If not logged in, render the welcome page
        res.render('index');
    }
});

// Community Routes
app.get('/communities/:name', ensureAuthenticated, async (req, res) => {
    const communityName = req.params.name;
    const communityPath = path.join(__dirname, 'views', 'communities', `${communityName}.ejs`);

    // Check if the community template exists
    if (!fs.existsSync(communityPath)) {
        return res.status(404).send("Community page not found.");
    }

    try {
        const posts = await Post.find({ community: communityName })
            .populate('author', 'username') // Populate only the username of the author
            .sort({ createdAt: -1 });
        const user = await User.findById(req.session.userId);
        res.render(`communities/${communityName}`, { posts, user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading community page");
    }
});

// Route to create a new post in a specific community
app.post('/communities/:name/create-post', ensureAuthenticated, async (req, res) => {
    const communityName = req.params.name;
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
        res.redirect(`/communities/${communityName}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating post");
    }
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
