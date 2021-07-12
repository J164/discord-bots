cd "%~dp0"
cd ..
call npm config set msvs_version 2017
call npm install
call choco upgrade ffmpeg