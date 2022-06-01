import json
import sys
from yt_dlp import YoutubeDL

YoutubeDL({ **json.loads(sys.argv[2]), 'noprogress': True, 'quiet': True }).download([ sys.argv[1] ])
