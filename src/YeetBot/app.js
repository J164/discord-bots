"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on('uncaughtException', err => {
    console.log(err);
    setInterval(function () { }, 1000);
});
const Discord = require("discord.js");
const fs = require("fs");
const client = new Discord.Client();
//const home = 'D:/Bot Resources'
const root = '../';
const sysData = JSON.parse(fs.readFileSync(`${root}/assets/static/static.json`, { encoding: 'utf8' }));
//let userData = JSON.parse(fs.readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }))
/*const guildStatus: { [key: string]: GuildData } = {}

interface GuildData {
    voice: Discord.VoiceConnection;
    dispatcher: Discord.StreamDispatcher;
    audio: boolean;
}*/
client.on('ready', () => {
    console.log('We have logged in as ' + client.user.tag);
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
client.login(sysData.yeetKey);
//# sourceMappingURL=app.js.map