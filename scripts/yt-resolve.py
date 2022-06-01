import json
import sys
from yt_dlp import YoutubeDL

with YoutubeDL({ 'quiet': True, 'noprogress': True }) as ytdl:
    data = ytdl.sanitize_info(ytdl.extract_info(sys.argv[1], False))
print(json.dumps({ 'webpage_url': data['webpage_url'], 'title': data['title'], 'thumbnail': data['thumbnail'], 'duration': data['duration'] }))