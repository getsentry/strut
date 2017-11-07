import os
from youtube_dl.postprocessor import FFmpegPostProcessor
from youtube_dl.utils import prepend_extension, encodeFilename


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
