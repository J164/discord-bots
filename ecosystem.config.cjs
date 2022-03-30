const { readFileSync } = require('node:fs');

const options = JSON.parse(readFileSync('config.json'));

module.exports = {
  apps: [
    {
      name: 'potato',
      script: 'index.js',
      cron_restart: '0 4 * * *',
      restart_delay: 10_000,
      error_file: '/home/pi/resources/logs/potato/err.log',
      env: options,
    },
  ],
};
