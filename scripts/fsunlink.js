const fs = require('fs');

function deleteThisShit(path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, err => err ? reject(`Could not delete- ${path}`) : resolve(`successfully deleted- ${path}`));
    });
}

module.exports = deleteThisShit;