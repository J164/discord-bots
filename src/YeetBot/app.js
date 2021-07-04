"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on('uncaughtException', err => {
    console.log(err);
    setInterval(function () { }, 1000);
});
const Discord = require("discord.js");
const fs = require("fs");
const intents = ['GUILDS', 'GUILD_MESSAGES'];
let client = new Discord.Client({ ws: { intents: intents } });
//const home = 'D:/Bot Resources'
const root = 'C:/Users/jacob/OneDrive/Documents/Master Discord Bots/';
const sysData = JSON.parse(fs.readFileSync(`${root}/assets/static/static.json`, { encoding: 'utf8' }));
//let userData = JSON.parse(fs.readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }))
/*const guildStatus: { [key: string]: GuildData } = {}

interface GuildData {
    voice: Discord.VoiceConnection;
    dispatcher: Discord.StreamDispatcher;
    audio: boolean;
}*/
function defineEvents() {
    client.on('ready', () => {
        console.log('We have logged in as ' + client.user.tag);
        process.send('start');
        client.user.setActivity(sysData.yeetStatus[Math.floor(Math.random() * sysData.yeetStatus.length)]);
        setInterval(function () {
            //userData = refreshData(`${home}/sys_files/bots.json`)
            client.user.setActivity(sysData.yeetStatus[Math.floor(Math.random() * sysData.yeetStatus.length)]);
            /*for (const key in guildStatus) {
                if ('audio' in guildStatus[key] && !guildStatus[key].audio) {
                    try {
                        guildStatus[key].voice.disconnect()
                    } catch { }
                }
            }*/
        }, 60000);
    });
    client.on('message', msg => {
        if (msg.author.bot || !msg.guild) {
            return;
        }
        if (msg.content.toLowerCase().indexOf('yee') !== -1) {
            if (msg.content.toLowerCase().substr(msg.content.toLowerCase().indexOf('yee') + 1, 10) === 'eeeeeeeeee') {
                msg.reply('Wow! Much Yeet!');
                return;
            }
            msg.reply('YEEEEEEEEEET!');
        }
    });
}
process.on("message", function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy();
            console.log('Yeet Bot has been logged out');
            process.send('stop');
            break;
        case 'start':
            client = new Discord.Client({ ws: { intents: intents } });
            defineEvents();
            client.login(sysData.yeetKey);
            break;
    }
});
process.send('ready');
//# sourceMappingURL=app.js.map