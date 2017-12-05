const fs = require('fs');
const crypto = require('crypto');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const storage = require('@google-cloud/storage')();

exports.processSong = function(bucket, song, cb) {
  if (!song.video_id) return cb(new Error('missing video id'));
  if (!song.duration) return cb(new Error('missing duration'));

  song.start = song.start || 0;

  const hash = crypto.createHash('md5')
    .update(song.video_id)
    .update(':')
    .update(song.start + '')
    .update(':')
    .update(song.duration + '')
    .digest('hex');

  const file = bucket.file(hash + '.mp3');

  file.exists(function(err, exists) {
    if (err) return cb(err);
    if (exists) return cb();

    try {
      var ins = ytdl(song.video_id, {filter: 'audioonly'});
    } catch(e) {
      console.log(e, song);
      return;
    }
    const outs = file.createWriteStream({
      metadata: {
        contentType: 'audio/mpeg',
      }
    });

    outs.on('error', cb);
    outs.on('finish', cb);

    ffmpeg(ins)
      .setFfmpegPath(ffmpeg_static.path)
      .seekInput(song.start)
      .duration(song.duration)
      .format('mp3')
      .on('error', cb)
      .pipe(outs);
  });
}
