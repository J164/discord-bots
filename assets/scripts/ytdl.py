import json
import sys
import yt_dlp

options = json.loads(sys.argv[2])
url = options['url']
options['url'] = None
options['noprogress'] = True
with yt_dlp.YoutubeDL(options) as ytdl:
    try:
        if sys.argv[1] != 'resolve':
            ytdl.download([ url ])
        else:
            print(json.dumps(ytdl.sanitize_info(ytdl.extract_info(url, False))))
    except:
        print('{ "error": "FAILED" }')