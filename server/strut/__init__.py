import os
from subprocess import Popen
from youtube_dl import YoutubeDL
from youtube_dl.postprocessor import FFmpegPostProcessor
from youtube_dl.utils import prepend_extension, encodeFilename

video_id = '9h30Bx4Klxg'


class Trimmer(FFmpegPostProcessor):
    def __init__(self, downloader, start=0, duration=5):
        FFmpegPostProcessor.__init__(self, downloader)
        self.start = start
        self.duration = duration

    def run(self, information):
        filename = information['filepath']
        temp_filename = prepend_extension(filename, 'temp')
        self.run_ffmpeg(
            filename,
            temp_filename,
            ['-ss', str(self.start), '-t', str(self.duration)],
        )
        os.remove(encodeFilename(filename))
        os.rename(encodeFilename(temp_filename), encodeFilename(filename))
        return [], information


opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '256',
    }],
    'outtmpl': u'%s.%%(ext)s' % video_id,
}

with YoutubeDL(opts) as ydl:
    pp = Trimmer(ydl, start=30, duration=5)
    ydl.add_post_processor(pp)
    ydl.download(['https://www.youtube.com/watch?v=%s' % video_id])

    Popen(['/usr/bin/afplay', u'%s.mp3' % video_id]).wait()
