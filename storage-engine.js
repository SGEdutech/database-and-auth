const path = require('path');
const multer = require('multer');

function nameThatBitch(req, file, cb) {
	const fileNameInfo = path.parse(file.originalname);
	cb(null, fileNameInfo.name + '-' + Date.now() + fileNameInfo.ext);
}

function checkImageFileType(req, file, cb) {
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
	destination: './images/eventPics',
	filename: nameThatBitch
});

const uploadEventPics = multer({
	storage: eventPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkImageFileType
}).any();

function eventPicsMiddleware(req, res, next) {
	uploadEventPics(req, res, err => err ? console.error(err) : next());
}

const schoolPicsStorage = multer.diskStorage({
	destination: './images/schoolPics',
	filename: nameThatBitch
});

const uploadSchoolPics = multer({
	storage: schoolPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkImageFileType
}).any();

function schoolPicsMiddleware(req, res, next) {
	uploadSchoolPics(req, res, err => err ? console.error(err) : next());
}

const tuitionPicsStorage = multer.diskStorage({
	destination: './images/tuitionPics',
	filename: nameThatBitch
});

const uploadTuitionPics = multer({
	storage: tuitionPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkImageFileType
}).any();

function tuitionPicsMiddleware(req, res, next) {
	uploadTuitionPics(req, res, err => err ? console.error(err) : next());
}

const userPicsStorage = multer.diskStorage({
	destination: './images/userPics',
	filename: nameThatBitch
});

const uploadUserPics = multer({
	storage: userPicsStorage,
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	fileFilter: checkImageFileType
}).any();

function userCoverPicMiddleware(req, res, next) {
	uploadUserPics(req, res, err => err ? console.error(err) : next());
}

const solutionPdfStorage = multer.diskStorage({
	destination: './pdfs/solutions',
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

const notificationStorage = multer.diskStorage({
	destination: './pdfs/notification',
	filename: nameThatBitch
});

const uploadNotification = multer({
	storage: notificationStorage
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
	// fileFilter: checkFileType
}).any();

function notificationMiddleware(req, res, next) {
	uploadNotification(req, res, err => err ? console.error(err) : next());
}

const resourcesStorage = multer.diskStorage({
	destination: './images/resources',
	filename: nameThatBitch
});

const uploadResources = multer({
	storage: resourcesStorage
	// limits: {fileSize: 1024 * 1024},  // Unit Bytes
}).any();

function resourcesMiddleware(req, res, next) {
	uploadResources(req, res, err => err ? console.error(err) : next());
}

exports = module.exports = {
	eventPicsMiddleware,
	schoolPicsMiddleware,
	tuitionPicsMiddleware,
	userCoverPicMiddleware,
	solutionPdfMiddleware,
	notificationMiddleware,
	resourcesMiddleware
};
