const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

exports.lockitron = functions.https.onRequest(
  require('./lib/lockitron')({
    config: functions.config().lockitron || {},
    firestore: admin.firestore(),
  })
);

exports.onUpdateDocument = functions.firestore
  .document('users/{userid}')
  .onWrite(require('./lib/doc')({
    bucket: admin.storage().bucket(),
  })
);

exports.regenerate = functions.https.onRequest(
  require('./lib/regenerate')({
    firestore: admin.firestore(),
    bucket: admin.storage().bucket(),
  })
);
