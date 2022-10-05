import json
import sys
from yt_dlp import YoutubeDL

def main():
  YoutubeDL({ **json.loads(sys.argv[2]), 'noprogress': True, 'quiet': True }).download([ sys.argv[1] ])
  return 0

if __name__ == '__main__':
  sys.exit(main())
