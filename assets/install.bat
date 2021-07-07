cd "%~dp0"
cd ..
call npm config msvs_version 2017
call npm install
call tsc
call choco install ffmpeg
call choco upgrade ffmpeg