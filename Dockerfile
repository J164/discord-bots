FROM --platform=arm64 node:hydrogen

ENV NODE_ENV=production
WORKDIR /app
COPY [ "dist/", "package*.json", "./" ]

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp
RUN npm ci

CMD [ "node", "." ]