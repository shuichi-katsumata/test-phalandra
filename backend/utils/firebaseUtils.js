const admin = require('firebase-admin');
const serviceAccount = require('../firebase-adminsdk.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://phalandra-256-da694-default-rtdb.firebaseio.com",
    storageBucket: 'gs://phalandra-256-da694.appspot.com'
});
const db = admin.database();
const bucket = admin.storage().bucket();
module.exports = {
    admin, db, bucket,
};