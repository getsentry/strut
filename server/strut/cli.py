import os
import click


class Manager(object):
    def __init__(self, cache):
        self.cache = cache

    def fetch(self, song):
        filename = self.get_cached_path(song)

        if os.path.exists(filename):
            return

        opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '256',
            }],
            'outtmpl': u'%s.%%(ext)s' % os.path.splitext(filename)[0],
        }

        from .processor import Trimmer
        from youtube_dl import YoutubeDL

        with YoutubeDL(opts) as ydl:
            pp = Trimmer(ydl, start=song['options']['start'], duration=song['options']['duration'])
            ydl.add_post_processor(pp)
            ydl.download(['https://www.youtube.com/watch?v=%s' % song['options']['video_id']])

    def play(self, song):
        from subprocess import Popen
        Popen(['/usr/bin/afplay', self.get_cached_path(song)]).wait()

    def get_cached_path(self, song):
        from hashlib import md5
        return os.path.join(
            self.cache,
            md5(':'.join((
                song['options']['video_id'],
                str(song['options']['start']),
                str(song['options']['duration']),
            ))).hexdigest().decode('utf8')
        ) + '.mp3'

    def handle(self, song):
        if song['type'] != 'youtube':
            return

        self.fetch(song)
        self.play(song)


@click.command()
@click.option('--cache', type=click.Path(exists=True), help='path to cache song downloads')
@click.option('--project', help='Google project id')
@click.option('--subscription', help='pubsub subscription name')
@click.option('--max-latency', default=10, help='max latency in seconds before message is discarded')
def main(cache, project, subscription, max_latency):
    import time
    import json
    from google.cloud import pubsub_v1
    from google.cloud.pubsub_v1.subscriber.policy.thread import Policy

    class RetryPolicy(Policy):
        def on_exception(self, exception):
            time.sleep(0.1)

    client = pubsub_v1.SubscriberClient(policy_class=RetryPolicy)
    subscription = client.subscription_path(project, subscription)

    manager = Manager(cache)

    def cb(message):
        message.ack()
        data = json.loads(message.data)
        latency = (time.time()*1000) - data['ts']

        if latency > max_latency * 1000:
            click.echo('!too old of a message, ignoring')
            return

        click.echo('> Latency: %dms' % latency)
        try:
            manager.handle(data['user']['song'])
        except Exception as e:
            print(e)

    client.subscribe(subscription, callback=cb)

    while 1:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            return
