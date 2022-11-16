FROM node:hydrogen

WORKDIR /app
COPY [ "dist/", "package.json", "yarn.lock", "./" ]

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp && yarn install --frozen-lockfile --production

CMD [ "node", "." ]