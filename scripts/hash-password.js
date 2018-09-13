const hash = (() => {
    const crypto = require('crypto');

    const getSHA256 = data => {
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    return {getSHA256};

})();

function hashPassword(rawPassword) {
    const salt = 'assassin';
    return hash.getSHA256(salt + rawPassword);
}

function passwordHashMiddleware(req, res, next) {
    if (req.body && req.body.password) {
        req.body.password = hashPassword(req.body.password);
    }
    next();
}

exports = module.exports = {
    passwordHashMiddleware,
    hashPassword
};