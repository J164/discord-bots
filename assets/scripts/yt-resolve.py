import json
import sys
import yt_dlp

with yt_dlp.YoutubeDL(json.loads(sys.argv[2])) as ytdl:
    try:
        data = ytdl.sanitize_info(ytdl.extract_info(sys.argv[1], False))
        print(json.dumps({ 'webpage_url': data['webpage_url'], 'title': data['title'], 'thumbnail': data['thumbnail'], 'duration': data['duration'], 'success': True }))
    except:
        print(json.dumps({ "success": False }))