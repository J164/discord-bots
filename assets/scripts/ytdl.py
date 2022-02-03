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
            data = ytdl.sanitize_info(ytdl.extract_info(url, False))
            print(json.dumps({ 'webpage_url': data['webpage_url'], 'title': data['title'], 'thumbnail': data['thumbnail'], 'duration': data['duration'] }))
    except:
        print('{ "error": "FAILED" }')
