cd "%~dp0"
cd ..
call npm config set msvs_version 2019
call npm install
call choco upgrade ffmpeg