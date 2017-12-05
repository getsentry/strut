const pubsub = require('@google-cloud/pubsub')();

const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const uuid4 = require('uuid/v4');

function permissionDenied(response) {
  response.status(403).end();
}

module.exports = function lockitron(options) {
  const config = options.config;
  const LOCKITRON_LOCK_ID = Buffer.from(config.lock_id || 'TEST_LOCK_ID');
  const PUBLISHER = pubsub.topic(config.pubsub_topic || 'test-topic').publisher();
  const firestore = options.firestore;

  return function(request, response) {
    // Only accept POST
    if (request.method !== 'POST') {
      return response.status(405).end();
    }

    // Make sure we're getting JSON
    if (request.headers['content-type'] !== 'application/json') {
      return permissionDenied(response);
    }

    const payload = request.body,
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

      const user = doc.data();

      if (!user) {
        return permissionDenied(response);
      }

      const event = {
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
  }
}
