FROM node:hydrogen

WORKDIR /app
COPY . .

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp && yarn install --immutable --production

CMD [ "node", "dist" ]
