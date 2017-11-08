const admin = require('firebase-admin');
const functions = require('firebase-functions');
const pubsub = require('@google-cloud/pubsub')();

admin.initializeApp(functions.config().firebase);

const firestore = admin.firestore();

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const uuid4 = require('uuid/v4');

const CONFIG = functions.config().lockitron || {};
const LOCKITRON_LOCK_ID = Buffer.from(CONFIG.lock_id || 'TEST_LOCK_ID');
const PUBLISHER = pubsub.topic(CONFIG.pubsub_topic || 'test-topic').publisher();

function permissionDenied(response) {
  response.status(403).end();
}

exports.lockitron = functions.https.onRequest(function(request, response) {
  // Only accept POST
  if (request.method !== 'POST') {
    return response.status(405).end();
  }

  // Make sure we're getting JSON
  if (request.headers['content-type'] !== 'application/json') {
    return permissionDenied(response);
  }

  var payload = request.body,
      timestamp = payload.timestamp,
      signature = payload.signature,
      data = payload.data || {},
      activity = data.activity || {},
      user = data.user || {},
      email = user.email,
      lock = data.lock || {},
      lock_id = Buffer.from(lock.id || '');

  // We only care about the lock unlocking
  if (activity.kind !== 'lock-updated-unlocked') {
    return permissionDenied(response);
  }

  // Verify the lock.id is correct
  try {
    if (!crypto.timingSafeEqual(lock_id, LOCKITRON_LOCK_ID)) {
      return permissionDenied(response);
    }
  } catch(e) {
    return permissionDenied(response);
  }

  // At this point, we have an unlocked lock

  firestore.collection('users').doc(email).get().then(function(doc) {
    if (!doc.exists) {
      return permissionDenied(response);
    }

    user = doc.data();

    if (!user) {
      return permissionDenied(response);
    }

    var event = {
      id: uuid4(),
      ts: +new Date(),
      user: {
        email: email,
        bio: user.bio,
        song: user.songs[Math.floor(Math.random()*user.songs.length)],
      },
    };

    PUBLISHER.publish(Buffer.from(JSON.stringify(event)), function(err, messageId) {
      if (err) {
        return response.status(500).json(err);
      }
      return response.status(201).end();
    });

  }).catch(function(err) {
    // Firestore apparently failed.
    return response.status(500).json(err);
  });

});
