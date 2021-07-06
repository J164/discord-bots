cd "%~dp0"
cd ..
call npm install
call tsc
call choco install ffmpeg
call choco upgrade ffmpeg