import json
import sys
import yt_dlp

with yt_dlp.YoutubeDL(json.loads(sys.argv[2])) as ytdl:
    ytdl.download([ sys.argv[1] ])