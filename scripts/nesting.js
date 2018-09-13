const path = require('path');

function nestingMiddleware(req, res, next) {
    const bodyObj = req.body;

    if (bodyObj === undefined) next();

    let keys = Object.keys(bodyObj);

    keys.forEach(key => {
        if (bodyObj[key] === '') delete bodyObj[key];
    });

    keys = Object.keys(bodyObj);

    const objectsThatThisFunctionHasCreated = [];
    keys.forEach(key => {
        if (key.startsWith('n_')) {
            const splitArr = key.split('_');

            if (splitArr.length !== 4) throw new Error(`Proper naming rule not followed on ${key}`);

            const hostKey = splitArr[1];
            const keyToBeInserted = splitArr[2];
            const identifier = splitArr[3];
            const valueToBeInserted = bodyObj[key];
            let isWorkDone = false;

            if (bodyObj[hostKey] === undefined) bodyObj[hostKey] = [];
            bodyObj[hostKey].forEach(nestedObject => {
                if (nestedObject.identifierKey === identifier) {
                    nestedObject[keyToBeInserted] = valueToBeInserted;
                    isWorkDone = true;
                }
            });
            if (isWorkDone === false) {
                const objToBeInserted = {};
                objectsThatThisFunctionHasCreated.push(objToBeInserted);
                objToBeInserted.identifierKey = identifier;
                objToBeInserted[keyToBeInserted] = valueToBeInserted;
                bodyObj[hostKey].push(objToBeInserted);
            }
            delete bodyObj[key];
        }
    });
    if (req.files) {
        req.files.forEach(file => {
            const pathInfoArr = file.path.split('/');
            const img_path = path.join(pathInfoArr[pathInfoArr.length - 2], pathInfoArr[pathInfoArr.length - 1]);
            if (file.fieldname.startsWith('n_')) {
                const infoArr = file.fieldname.split('_');
                if (infoArr.length !== 4) throw new Error('Image: Proper naming not followed');
                const hostKeyName = infoArr[1];
                const imageName = infoArr[2];
                const identifierKey = infoArr[3];
                const arrayToBeInserted = bodyObj[hostKeyName];
                if (Array.isArray(arrayToBeInserted) === false) throw new Error('Image: Key to be inserted is not an array');
                arrayToBeInserted.forEach(nestedObj => {
                    if (nestedObj.identifierKey === identifierKey) {
                        nestedObj[`img_${imageName}`] = img_path;
                    }
                });
            } else {
                bodyObj[`img_${file.fieldname}`] = img_path;
            }
        });
    }
    objectsThatThisFunctionHasCreated.forEach(object => delete object.identifierKey);
    next();
}

exports.nestingMiddleware = nestingMiddleware;

// Syntax for text n_hostname_keyToBeInserted_identifier

// Syntax for images n_hostname_imagename_identifier
