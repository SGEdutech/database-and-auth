function redirectUnknownHostMiddlewareEduatlas(req, res, next) {
    // localhost is for dev purpose
    if (/eduatlas.com$/.test(req.get('host')) === false && req.get('host').startsWith('localhost') === false) {
        res.status(410).redirect('https://eduatlas.com');
        return;
    }
    next();
}

function redirectUnknownHostMiddlewareEduatlasEnterprise(req, res, next) {
    // localhost is for dev purpose
    if (/erp.eduatlas.com$/.test(req.get('host')) === false && req.get('host').startsWith('localhost') === false) {
        res.status(410).redirect('https://erp.eduatlas.com');
        return;
    }
    next();
}

module.exports = {redirectUnknownHostMiddlewareEduatlas, redirectUnknownHostMiddlewareEduatlasEnterprise};