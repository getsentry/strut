const functions = require('firebase-functions');

exports.lockitron = functions.https.onRequest(function(request, response) {
  response.send('hello');
});
