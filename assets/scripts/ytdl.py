import json
import sys
import yt_dlp

print('READY')

for line in sys.stdin:
    options = json.loads(line.strip())
    url = options['url']
    options['url'] = None
    options['noprogress'] = True
    with yt_dlp.YoutubeDL(options) as ytdl:
        try:
            ytdl.download([ url ])
        except:
            print('{ "error": "FAILED" }')
    exit()