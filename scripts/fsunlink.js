const fs = require('fs');

function deleteThisShit(path) {
	if (path === undefined) throw new Error('Path not provided');
	return new Promise((resolve, reject) => {
		fs.unlink(path, err => err ? reject(`Could not delete- ${path}`) : resolve(`successfully deleted- ${path}`));
	});
}

module.exports = deleteThisShit;
