cd "%~dp0"
cd ..
call npm install
cd src/KrenkoBot
call npm install
cd ../PotatoBot
call npm install
cd ../SwearBot
call npm install
cd ../files
call choco install ffmpeg
call choco upgrade ffmpeg