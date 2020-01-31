const admin = require('firebase-admin');
var serviceAccount = require('./key/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialape-be435.firebaseio.com",
  storageBucket: "socialape-be435.appspot.com",
});
const database = admin.firestore();

module.exports = {
  admin,
  database
};