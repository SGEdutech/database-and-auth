const mongoose = require('mongoose');
const uri = require('../config').MONGO.URI;

mongoose.connect(uri, { useNewUrlParser: true })
    .then(() => console.log('DB\'s Connected'))
    .catch(err => console.error(err));
