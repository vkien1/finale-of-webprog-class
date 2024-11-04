// middleware/authMiddleware.js
function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Proceed if user is authenticated
    }
    res.redirect('/login'); // Redirect to login if not authenticated
}

module.exports = ensureAuthenticated;
