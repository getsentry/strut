const processSong = require('./yt').processSong;

module.exports = function(options) {
  const firestore = options.firestore;
  const bucket = options.bucket;

  return function(request, response) {
    firestore.collection('users').get().then(function(q) {
      q.forEach(function(doc) {
        const data = doc.data() || {};
        const songs = data.songs || [];
        if (!songs.length) return;

        console.log('Handling change for', doc.id);

        for (var i = 0; i < songs.length; i++) {
          const song = songs[i];
          if (song.type !== 'youtube') {
            continue;
          }
          if (!song.options) { continue; }
          processSong(bucket, song.options, function(err) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
      response.end();
    });
  };
};
