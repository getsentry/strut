const processSong = require('./yt').processSong;

module.exports = function (options) {
  const bucket = options.bucket;

  return function (event) {
    const doc = event.data.data() || {};
    const songs = doc.songs || [];
    if (!songs.length) return;

    console.log('Handling change for', event.params.userid);

    for (var i = 0; i < songs.length; i++) {
      var song = songs[i];
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
  };
};
