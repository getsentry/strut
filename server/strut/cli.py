import click


@click.command()
@click.option('--video-id')
def main(video_id):
    from .processor import Trimmer

    from subprocess import Popen
    from youtube_dl import YoutubeDL

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
