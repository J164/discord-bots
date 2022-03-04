import json
import sys
import yt_dlp

with yt_dlp.YoutubeDL(json.loads(sys.argv[2])) as ytdl:
    try:
        ytdl.download([ sys.argv[1] ])
    except:
        print(json.dumps({ "success": False }))