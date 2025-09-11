const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: `gs://${process.env.FIREBASE_STORAGE_BUCKET}`
});
const db = admin.database();
const bucket = admin.storage().bucket();
module.exports = {
    admin, db, bucket,
};