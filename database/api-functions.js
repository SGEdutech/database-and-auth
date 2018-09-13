const mongoose = require('mongoose');
const deleteThisShit = require('../scripts/fsunlink');
const path = require('path');

class DatabaseAPI {
    constructor(model) {
        if (model === undefined) throw new Error('No model provided!');
        this.model = model;
    }

    getAllData(opts = {}) {
        if (typeof opts !== 'object') throw new Error('Options needs to be an object!');

        return this.getMultipleData({}, opts);
    }

    getDataFromMultipleIds(idArray, opts = {}) {
        const homeAdvertisement = opts.homeAdvertisement || false;
        const searchAdvertisement = opts.searchAdvertisement || false;
        const relatedAdvertisement = opts.relatedAdvertisement || false;

        idArray.forEach((id, index) => idArray[index] = mongoose.Types.ObjectId(id));

        return new Promise((resolve, reject) => {
            this.model.find({_id: {$in: idArray}}).then(documents => {
                resolve(documents);
                documents.forEach(document => {
                    if (document.hits) {
                        if (homeAdvertisement) document.hits.homeAdvertisement.push(Date.now());
                        if (searchAdvertisement) document.hits.searchAdvertisement.push(Date.now());
                        if (relatedAdvertisement) document.hits.relatedAdvertisement.push(Date.now());
                        document.save();
                    }
                })
            }).catch(err => reject(err));
        });
    }

    getMultipleData(searchParameters, opts = {}) {
        if (typeof opts !== 'object') throw new Error('Options needs to be an object!');

        const demands = opts.demands || '';
        const skip = opts.skip || 0;
        const limit = opts.limit || 0;
        const incrementHits = opts.incrementHits || false;

        if (incrementHits === false) return this.model.find(searchParameters, demands).skip(skip).limit(limit);

        return this._getDocumentsAndIncrementTotalHitsOrViews({searchParameters, demands, skip, limit})
    }


    getOneRelationalData(searchParameters, relationalConfig, opts = {}) {
        if (typeof searchParameters !== 'object') throw new Error('SearchParameters needs to be an object!');
        if (typeof relationalConfig !== 'object') throw new Error('Relational Config needs to be an object!');
        if (typeof opts !== 'object') throw new Error('Options needs to be an object!');

        const populate = relationalConfig.populate || '';
        const populationDemands = relationalConfig.demands || '';
        const demands = opts.demands || '';

        return this.model.find(searchParameters).select(demands).populate(populate, populationDemands);
    }

    getOneRelationalDataWithDepthTwo(searchParameter, relationalConfigFirstDegree, relationalConfigSecondDegree, opts = {}) {
        if (typeof searchParameter !== 'object') throw new Error('SearchParameters needs to be an object!');
        if (typeof relationalConfigFirstDegree !== 'object') throw new Error('Relational Config needs to be an object!');
        if (typeof opts !== 'object') throw new Error('Options needs to be an object!');

        const demands = opts.demands || '';
        const firstDegreePath = relationalConfigFirstDegree.path || '';
        const firstDegreeDemands = relationalConfigFirstDegree.demands || '';
        const secondDegreePath = relationalConfigSecondDegree.path || '';
        const secondDegreeDemands = relationalConfigSecondDegree.demands || '';

        return this.model.find(searchParameter).select(demands).populate({
            path: firstDegreePath,
            select: firstDegreeDemands,
            populate: { path: secondDegreePath, select: secondDegreeDemands }
        });
    }

    _getDocumentsAndIncrementTotalHitsOrViews(opts) {
        if (typeof opts !== 'object') throw new Error('Options needs to be an object!');

        const searchParameters = opts.searchParameters || {};
        const findingCriteria = opts.findOne ? 'findOne' : 'find';
        return new Promise((resolve, reject) => {
            this.model[findingCriteria](searchParameters, opts.demands).skip(opts.skip).limit(opts.limit).then(result => {
                resolve(result);
                if (Array.isArray(result)) {
                    result.forEach(document => {
                        if (document.hits) {
                            document.hits.total.push(Date.now());
                            document.save();
                        }
                    });
                } else {
                    // TODO: Optimise
                    if (result.views) {
                        result.views.total.push(Date.now());
                        if (opts.homeAdvertisement) result.views.homeAdvertisement.push(Date.now());
                        if (opts.searchAdvertisement) result.views.searchAdvertisement.push(Date.now());
                        if (opts.relatedAdvertisement) result.views.relatedAdvertisement.push(Date.now());
                        result.save();
                    }
                }
            }).catch(err => reject(err));
        })
    }

    getSpecificData(searchParameters, opts = {}) {
        if (typeof opts !== 'object') throw new Error('Options needs to be an object!');

        const returnPassword = opts.returnPassword || false;
        const incrementView = opts.incrementView || false;
        const homeAdvertisement = opts.homeAdvertisement || false;
        const searchAdvertisement = opts.searchAdvertisement || false;
        const relatedAdvertisement = opts.relatedAdvertisement || false;
        const findOne = true;

        const select = returnPassword ? '+password' : '';


        if (incrementView === false) return this.model.findOne(searchParameters).select(select);

        return this._getDocumentsAndIncrementTotalHitsOrViews({searchParameters, findOne, homeAdvertisement, searchAdvertisement, relatedAdvertisement});
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
