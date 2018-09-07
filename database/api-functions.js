const deleteThisShit = require('../../eduatlas-backend/scripts/fsunlink');
const path = require('path');

class DatabaseAPI {
    constructor(model) {
        this.model = model;
    }

    getAllData(demands, skip, limit) {
        return this.model.find({}, demands)
            .skip(skip)
            .limit(limit);
    }

    getMultipleData(searchParameters, demands, skip, limit, sortBy) {
        return this.model.find(searchParameters, demands)
            .skip(skip)
            .limit(limit)
            .sort([
                [sortBy, 'descending']
            ]);
    }

    getSpecificData(searchParameters, incrementView, returnPassword) {
        const select = returnPassword ? '+password' : '';
        if (incrementView === undefined) return this.model.findOne(searchParameters);
        return new Promise((resolve, reject) => {
            this.model.findOne(searchParameters)
                .select(select)
                .then(data => {
                    resolve(data);
                    if (data.views) data.views += 1;
                    if (data.hits) data.hits += 1;
                    data.save();
                })
                .catch(err => reject(err));
        });
    }

    addCollection(newRowInformation) {
        const newInstance = new this.model(newRowInformation);
        return newInstance.save();
    }

    updateOneRow(searchParameters, newInformation) {
        return new Promise((resolve, reject) => {
            this.model.findOneAndUpdate(searchParameters, newInformation)
                .then(() => this.model.findOne(searchParameters)
                    .select('+password'))
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }

    static _deleteIfImage(keyName, possibleImgPath) {
        if (keyName.startsWith('img_')) {
            deleteThisShit(path.join('.', 'public', 'images', possibleImgPath))
                .then(message => console.log(message))
                .catch(err => console.warn(err));
            return true;
        }
        return false;
    }

    static _deleteIfAnyNestedObjectsHasImage(arrayOfNestedObjects) {
        if (Array.isArray(arrayOfNestedObjects)) {
            arrayOfNestedObjects.forEach(nestedObject => {
                const nestedKeys = Object.keys(nestedObject);
                nestedKeys.forEach(nestedKey => {
                    this._deleteIfImage(nestedKey, nestedObject[nestedKey]);
                });
            });
        }
    }

    deleteOneRow(searchParameter) {
        return new Promise((resolve, reject) => {
            let deletedRow;
            this.model.findOne(searchParameter)
                .then(collectionToBeDeleted => {
                    if (collectionToBeDeleted === null) reject('No collection found');
                    deletedRow = collectionToBeDeleted;
                    collectionToBeDeleted = collectionToBeDeleted.toObject(); // Some mongoose bullshit
                    const keys = Object.keys(collectionToBeDeleted);
                    keys.forEach(key => {
                        if (this.constructor._deleteIfImage(key, collectionToBeDeleted[key])) return;
                        const possibleArrayOfNestedObjects = collectionToBeDeleted[key];
                        this.constructor._deleteIfAnyNestedObjectsHasImage(possibleArrayOfNestedObjects);
                    });
                    return this.model.findOneAndRemove(searchParameter);
                })
                .then(() => resolve(deletedRow))
                .catch(err => reject(err));
        });
    }

    addElementToArray(modelSearchParameter, arrayName, elementToBePushed) {
        return new Promise((resolve, reject) => {
            this.model.findOne(modelSearchParameter)
                .then(data => {
                    data[arrayName].push(elementToBePushed);
                    return data.save();
                })
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }

    updateElementInArray(modelSearchParameter, arrayName, nestedObjectId, updatedInformation) {
        return new Promise((resolve, reject) => {
            this.model.findOne(modelSearchParameter)
                .then(data => {
                    const nestedObject = data[arrayName].id(nestedObjectId);
                    const keys = Object.keys(updatedInformation);
                    keys.forEach(key => nestedObject[key] = updatedInformation[key]);
                    return data.save();
                })
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }

    deleteElementFromArray(modelSearchParameter, arrayName, identifier) {
        return new Promise((resolve, reject) => {
            if (modelSearchParameter === 'undefined') throw new Error('Model search parameter not provided');
            if (arrayName === 'undefined') throw new Error('Array name not provided');
            if (identifier === 'undefined') throw new Error('Identifier not provided');
            this.model.findOne(modelSearchParameter)
                .then(data => {
                    if (typeof identifier === 'string') {
                        data[arrayName].forEach((item, index) => {
                            if (identifier === item) {
                                data[arrayName].splice(index, 1);
                            }
                        });
                    } else {
                        const nestedObjectIdentifierKey = Object.keys(identifier)[0];
                        data[arrayName].forEach((item, index) => {
                            if (item[nestedObjectIdentifierKey] === identifier[nestedObjectIdentifierKey]) {
                                const nestedObjectKeys = Object.keys(item);
                                nestedObjectKeys.forEach(nestedKey => {
                                    this.constructor._deleteIfImage(nestedKey, item[nestedKey]);
                                });
                                data[arrayName].splice(index, 1);
                            }
                        });
                    }
                    return data.save();
                })
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }

    emptyKey(modelSearchParameter, key) {
        return new Promise((resolve, reject) => {
            if (typeof modelSearchParameter !== 'object') throw new Error('Model search parameter not an object');
            this.model.findOne(modelSearchParameter)
                .then(collection => {
                    if (collection[key] === undefined) throw new Error('Key not found');
                    this.constructor._deleteIfAnyNestedObjectsHasImage(collection[key]);
                    collection[key] = Array.isArray(collection[key]) ? [] : undefined;
                    return collection.save();
                })
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }
}

module.exports = DatabaseAPI;
