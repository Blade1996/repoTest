'use strict';

const admin = require('firebase-admin');

/* eslint-disable import/no-unresolved */
const serviceAccount = require('./../fb.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_URL,
});

module.exports = admin;
