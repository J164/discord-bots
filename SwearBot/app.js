var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
process.on('uncaughtException', err => {
    console.log(err);
    setInterval(function () { }, 1000);
});
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const prefix = '?';
const home = process.env.USERPROFILE;
var data = require(`${home}/Downloads/Bot Resources/sys_files/bots.json`);
var guildStatus = {};
function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' });
    data = JSON.parse(jsonString);
}
client.on('ready', () => {
    console.log('We have logged in as ' + client.user.tag);
    client.user.setActivity(data.swearStatus[Math.floor(Math.random() * data.swearStatus.length)]);
    setInterval(function () {
        refreshData(`${home}/Downloads/Bot Resources/sys_files/bots.json`);
        client.user.setActivity(data.swearStatus[Math.floor(Math.random() * data.swearStatus.length)]);
        for (const key in guildStatus) {
            if ('audio' in guildStatus[key] && !guildStatus[key].audio) {
                try {
                    guildStatus[key].voice.disconnect();
                }
                catch (_a) { }
            }
        }
    }, 60000);
});
function play(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let songNum;
        let vc = msg.member.voice.channel;
        if (!vc) {
            msg.reply('This command can only be used while in a voice channel!');
            return;
        }
        try {
            if (parseInt(msg.content.split(" ")[1]) <= data.swearSongs.length && parseInt(msg.content.split(" ")[1]) > 0) {
                songNum = parseInt(msg.content.split(" ")[1]) - 1;
            }
            else {
                songNum = Math.floor(Math.random() * data.swearSongs.length);
            }
        }
        catch (_a) {
            songNum = Math.floor(Math.random() * data.swearSongs.length);
        }
        if (!(msg.guild.id in guildStatus)) {
            guildStatus[msg.guild.id] = {};
        }
        guildStatus[msg.guild.id].audio = true;
        let voice = yield vc.join();
        guildStatus[msg.guild.id].voice = voice;
        if ('dispatcher' in guildStatus[msg.guild.id]) {
            try {
                guildStatus[msg.guild.id].dispatcher.destroy();
            }
            catch (_b) { }
        }
        guildStatus[msg.guild.id].dispatcher = voice.play(`${home}/Downloads/Bot Resources/music_files/swear_songs/${data.swearSongs[songNum]}`);
        guildStatus[msg.guild.id].dispatcher.on('finish', () => {
            guildStatus[msg.guild.id].dispatcher.destroy();
            guildStatus[msg.guild.id].audio = false;
        });
    });
}
client.on('message', msg => {
    if (msg.author.bot || !msg.guild) {
        return;
    }
    if (!(msg.guild.id in guildStatus)) {
        guildStatus[msg.guild.id] = {};
    }
    if (!msg.content.startsWith(prefix)) {
        if (msg.content.indexOf('swear') != -1) {
            msg.reply(data.blacklist.swears[Math.floor(Math.random() * data.blacklist.swears.length)]);
            return;
        }
        for (const swear of data.blacklist.swears) {
            if (msg.content.indexOf(swear) != -1) {
                msg.reply('Good job swearing! Heck yeah!');
                return;
            }
        }
        return;
    }
    let messageStart = msg.content.split(" ")[0].slice(1);
    try {
        switch (messageStart) {
            case 'play':
                play(msg);
                break;
            case 'pause':
                if (!(msg.guild.toString() in guildStatus) || !('dispatcher' in guildStatus[msg.guild.toString()])) {
                    msg.reply('Nothing is playing!');
                    return;
                }
                guildStatus[msg.guild.toString()].dispatcher.pause();
                msg.reply('Paused!');
                break;
            case 'resume':
                if (!(msg.guild.toString() in guildStatus) || !('dispatcher' in guildStatus[msg.guild.toString()])) {
                    msg.reply('Nothing is playing!');
                    return;
                }
                guildStatus[msg.guild.toString()].dispatcher.resume();
                msg.reply('Resumed!');
                break;
            case 'stop':
                if (!(msg.guild.toString() in guildStatus) || !('dispatcher' in guildStatus[msg.guild.toString()])) {
                    msg.reply('There is nothing playing!');
                    return;
                }
                guildStatus[msg.guild.toString()].dispatcher.destroy();
                guildStatus[msg.guild.toString()].audio = false;
                msg.reply('Success');
                break;
        }
    }
    catch (err) {
        console.log(err);
    }
});
client.login(data.swearKey);
//# sourceMappingURL=app.js.map