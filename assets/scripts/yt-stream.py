import json
import sys
from time import sleep
from yt_dlp import YoutubeDL

YoutubeDL({ **json.loads(sys.argv[2]), 'outtmpl': '-', 'noprogress': True, 'quiet': True }).download([ sys.argv[1] ])
while True:
    sleep(1)
