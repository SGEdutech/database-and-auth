const sendMail = require('./send-mail');
const path = require('path');
const Printer = require('pdfmake');
const { docDefinition } = require('../pdf-markup.json');

// fonts are available in the test-env/tests/fonts path, this is a helper
function fontPath(file) {
	return path.join(__dirname, '..', 'fonts', file);
}

// required font setup, requires that you link to the fonts shipped with npm
const fontDescriptors = {
	Roboto: {
		normal: fontPath('Roboto-Regular.ttf'),
		bold: fontPath('Roboto-Medium.ttf'),
		italics: fontPath('Roboto-Italic.ttf'),
		bolditalics: fontPath('Roboto-Italic.ttf')
	}
};
const printer = new Printer(fontDescriptors);

const pdfDocument = printer.createPdfKitDocument(docDefinition);

// Turn the stream into a Buffer
// Usage: getDoc(pdfDoc, function (err, buffer, pages) { const base64 = buffer.toString('base64'); /* app logic */ });
function getDoc(pdfDoc) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		pdfDoc.on('data', chunk => chunks.push(chunk));
		pdfDoc.on('end', () => {
			const result = Buffer.concat(chunks);
			resolve(result);
		});
		pdfDoc.on('error', err => reject(err));
		pdfDoc.end();
	});
}

async function sendReciept() {
	try {
		const pdfBuffer = await getDoc(pdfDocument);
		// console.log(pdfBuffer);
		sendMail('ashish@thebrainlab.in', 'Some Subject', 'Some Message', { content: pdfBuffer, filename: 'reciept.pdf', contentType: 'application/pdf' })
	} catch (err) {
		console.error(err);
	}
}

sendReciept()
