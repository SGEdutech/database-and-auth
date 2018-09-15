const path = require('path');
const multer = require('multer');

function nameThatBitch(req, file, cb) {
	const fileNameInfo = path.parse(file.originalname);
	cb(null, fileNameInfo.name + '-' + Date.now() + fileNameInfo.ext);
}

function checkFileType(req, file, cb) {
	const allowedFileTypes = /jpeg|jpg|png|gif|svg/i;
	const isExtensionValid = allowedFileTypes.test(path.extname(file.originalname));
	const isMimeValid = allowedFileTypes.test(file.mimetype);
	if (isExtensionValid && isMimeValid) {
		cb(null, true);
	} else {
		cb(new Error('Err: Image Only'), false);
	}
}

const eventPicsStorage = multer.diskStorage({
	destination: './public/images/eventPics',
	filename: nameThatBitch
});

const uploadEventPics = multer({
	storage: eventPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkFileType
}).any();

function eventPicsMiddleware(req, res, next) {
	uploadEventPics(req, res, err => err ? console.error(err) : next());
}

const schoolPicsStorage = multer.diskStorage({
	destination: './public/images/schoolPics',
	filename: nameThatBitch
});

const uploadSchoolPics = multer({
	storage: schoolPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkFileType
}).any();

function schoolPicsMiddleware(req, res, next) {
	uploadSchoolPics(req, res, err => err ? console.error(err) : next());
}

const tuitionPicsStorage = multer.diskStorage({
	destination: './public/images/tuitionPics',
	filename: nameThatBitch
});

const uploadTuitionPics = multer({
	storage: tuitionPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkFileType
}).any();

function tuitionPicsMiddleware(req, res, next) {
	uploadTuitionPics(req, res, err => err ? console.error(err) : next());
}

const userPicsStorage = multer.diskStorage({
	destination: './public/images/userPics',
	filename: nameThatBitch
});

const uploadUserPics = multer({
	storage: userPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkFileType
}).any();

function userCoverPicMiddleware(req, res, next) {
	uploadUserPics(req, res, err => err ? console.error(err) : next());
}

const solutionPdfStorage = multer.diskStorage({
	destination: './public/pdfs/solutions',
	filename: nameThatBitch
});

const uploadSolutionPdf = multer({
	storage: solutionPdfStorage
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	// fileFilter: checkFileType
}).any();

function solutionPdfMiddleware(req, res, next) {
	uploadSolutionPdf(req, res, err => err ? console.error(err) : next());
}

exports = module.exports = {
	eventPicsMiddleware,
	schoolPicsMiddleware,
	tuitionPicsMiddleware,
	userCoverPicMiddleware,
	solutionPdfMiddleware
};
