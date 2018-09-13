//TODO: Add return password and views and hits
function sanitizeDemandsMiddleware(req, res, next) {
    const passwordRegex = new RegExp('password');
    if (req.query.demands) {
        if (passwordRegex.test(req.query.demands)) {
            res.send('You are not authorised');
            return;
        }
    }
    next();
}

module.exports = sanitizeDemandsMiddleware;