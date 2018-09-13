module.exports = text => {
    if (text === undefined || text === '') {
        console.info('No text provided');
        return;
    }
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};