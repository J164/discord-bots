import json
import sys
from time import sleep
import yt_dlp

with yt_dlp.YoutubeDL({ **json.loads(sys.argv[2]), 'outtmpl': '-', 'noprogress': True, 'quiet': True, 'ratelimit': 200_000 }) as ytdl:
    ytdl.download([ sys.argv[1] ])
    while True:
        sleep(60)