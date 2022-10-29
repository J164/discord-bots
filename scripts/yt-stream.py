import json
import sys
from asyncio import get_event_loop
from yt_dlp import YoutubeDL

def main():
    YoutubeDL({ **json.loads(sys.argv[2]), 'outtmpl': '-', 'noprogress': True, 'quiet': True }).download([ sys.argv[1] ])
    get_event_loop().run_forever()

if __name__ == '__main__':
  main()