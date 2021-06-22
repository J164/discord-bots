"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
process.on('uncaughtException', err => {
    console.log(err);
    setInterval(function () { }, 1000);
});
const Discord = require("discord.js"); // Discord api library
const fs = require("fs"); // Filesystem
const axios = require("axios"); // Used to make http requests
const canvas = require("canvas"); // Allows the manipulation of images
const youtubedl = require('youtube-dl-exec'); // Youtube video downloader
const client = new Discord.Client({ ws: { intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS'] } }); // Represents the bot client
const prefix = '&'; // Bot command prefix
const home = 'D:/Bot Resources'; // Represents path to resources
const root = '../..';
const sysData = JSON.parse(fs.readFileSync(`${root}/assets/static/static.json`, { encoding: 'utf8' })); // Loads system info into memory
let userData = JSON.parse(fs.readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' })); // Loads persistant info into memory
const users = { admin: null, swear: null }; // Stores specific users
const guildStatus = {}; // Stores guild specific information to allow bot to act independent in different guilds
function voiceKick(count, voiceState) {
    if (voiceState.channelID) {
        voiceState.kick();
        return;
    }
    if (count > 5) {
        return;
    }
    setTimeout(() => voiceKick(count + 1, voiceState), 2000);
}
// Merges multiple images into one image
function mergeImages(filePaths, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const activeCanvas = canvas.createCanvas(options.width, options.height);
        const ctx = activeCanvas.getContext('2d');
        for (const [i, path] of filePaths.entries()) {
            const image = yield canvas.loadImage(path);
            ctx.drawImage(image, i * (options.width / filePaths.length), 0);
        }
        return activeCanvas.toBuffer();
    });
}
// Creates a commonly used discord embed
function genericEmbedResponse(title) {
    const embedVar = new Discord.MessageEmbed();
    embedVar.setTitle(title);
    embedVar.setColor(0x0099ff);
    return embedVar;
}
// Refreshes the data variable
function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' });
    return JSON.parse(jsonString);
}
// Makes a http get request
function makeGetRequest(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios.default.get(path);
        return response.data;
    });
}
// Recursively plays each video in the queue
function playQueue(channel, guildId, vc) {
    return __awaiter(this, void 0, void 0, function* () {
        if (guildStatus[guildId].queue.length < 1) {
            return;
        }
        guildStatus[guildId].audio = true;
        try {
            guildStatus[guildId].voice = yield vc.join();
        }
        catch (err) {
            console.log(err);
            channel.send('Something went wrong!');
            guildStatus[guildId].audio = false;
            guildStatus[guildId].queue = [];
            return;
        }
        const currentSong = guildStatus[guildId].queue.shift();
        if (!fs.existsSync(`${home}/music_files/playback/${currentSong.id}.json`)) {
            try {
                const output = yield youtubedl(currentSong.webpageUrl, {
                    noWarnings: true,
                    noCallHome: true,
                    noCheckCertificate: true,
                    preferFreeFormats: true,
                    ignoreErrors: true,
                    geoBypass: true,
                    printJson: true,
                    format: 'bestaudio',
                    output: `${home}/music_files/playback/%(id)s.mp3`
                });
                currentSong.thumbnail = output.thumbnails[0].url;
                const metaData = JSON.stringify({
                    webpageUrl: currentSong.webpageUrl,
                    title: currentSong.title,
                    id: currentSong.id,
                    thumbnail: currentSong.thumbnail,
                    duration: currentSong.duration
                });
                fs.writeFileSync(`${home}/music_files/playback/${currentSong.id}.json`, metaData);
            }
            catch (_a) { }
        }
        guildStatus[guildId].voice.play(`${home}/music_files/playback/${currentSong.id}.mp3`);
        guildStatus[guildId].nowPlaying = genericEmbedResponse(`Now Playing: ${currentSong.title}`);
        guildStatus[guildId].nowPlaying.setImage(currentSong.thumbnail);
        guildStatus[guildId].nowPlaying.addField('URL:', currentSong.webpageUrl);
        if (!guildStatus[guildId].singleLoop) {
            channel.send(guildStatus[guildId].nowPlaying);
        }
        guildStatus[guildId].voice.dispatcher.on('finish', () => {
            if (guildStatus[guildId].fullLoop) {
                guildStatus[guildId].queue.push(currentSong);
            }
            else if (guildStatus[guildId].singleLoop) {
                guildStatus[guildId].queue.unshift(currentSong);
            }
            guildStatus[guildId].voice.dispatcher.destroy();
            guildStatus[guildId].audio = false;
            playQueue(channel, guildId, vc);
        });
    });
}
// Fetches a user from a specific guild using their ID
function getUser(guildId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const guild = yield client.guilds.fetch(guildId);
        const user = yield guild.members.fetch({ user: userId });
        return user;
    });
}
function download(guildId) {
    return __awaiter(this, void 0, void 0, function* () {
        while (guildStatus[guildId].downloadQueue.length > 0) {
            guildStatus[guildId].downloading = true;
            const currentItem = guildStatus[guildId].downloadQueue.shift();
            try {
                const output = yield youtubedl(currentItem, {
                    noWarnings: true,
                    noCallHome: true,
                    noCheckCertificate: true,
                    preferFreeFormats: true,
                    ignoreErrors: true,
                    geoBypass: true,
                    printJson: true,
                    format: 'bestaudio',
                    output: `${home}/music_files/playback/%(id)s.mp3`
                });
                for (let i = 0; i < guildStatus[guildId].queue.length; i++) {
                    if (guildStatus[guildId].queue[i].title === output.title) {
                        guildStatus[guildId].queue[i].thumbnail = output.thumbnails[0].url;
                        const metaData = JSON.stringify({
                            webpageUrl: guildStatus[guildId].queue[i].webpageUrl,
                            title: guildStatus[guildId].queue[i].title,
                            id: guildStatus[guildId].queue[i].id,
                            thumbnail: guildStatus[guildId].queue[i].thumbnail,
                            duration: guildStatus[guildId].queue[i].duration
                        });
                        fs.writeFileSync(`${home}/music_files/playback/${guildStatus[guildId].queue[i].id}.json`, metaData);
                    }
                }
            }
            catch (_a) { }
        }
        guildStatus[guildId].downloading = false;
    });
}
class Euchre {
    constructor(players) {
        this.team1 = {
            tricks: 0,
            score: 0
        };
        this.team2 = {
            tricks: 0,
            score: 0
        };
        this.players = [{
                id: 0,
                user: players[0],
                hand: [],
                team: this.team1
            },
            {
                id: 1,
                user: players[1],
                hand: [],
                team: this.team2
            },
            {
                id: 2,
                user: players[2],
                hand: [],
                team: this.team1
            },
            {
                id: 3,
                user: players[3],
                hand: [],
                team: this.team2
            }];
        this.active = true;
        this.gameState = {
            top: null,
            inPlay: [],
            trump: ''
        };
    }
    startGame() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.startRound();
            while (this.team1.score < 10 && this.team2.score < 10) {
                const newOrder = [this.players[3], this.players[0], this.players[1], this.players[2]];
                this.players = newOrder;
                yield this.startRound();
            }
            const results = genericEmbedResponse('Game Over!');
            results.addField('Players', `${this.players[0].id}, ${this.players[1].id}, ${this.players[2].id}, ${this.players[3].id}`);
            if (this.team1.score > 10) {
                results.addField('Team 1 Wins!', `${this.team1.score} - ${this.team2.score}`);
            }
            else {
                results.addField('Team 2 Wins!', `${this.team2.score} - ${this.team1.score}`);
            }
            return results;
        });
    }
    startRound() {
        return __awaiter(this, void 0, void 0, function* () {
            let draws;
            let success = false;
            while (!success) {
                try {
                    const deck = yield axios.default.post('https://deckofcardsapi.com/api/deck/new/shuffle?cards=9S,9D,9C,9H,0S,0D,0C,0H,JS,JD,JC,JH,QS,QD,QC,QH,KS,KD,KC,KH,AS,AD,AC,AH');
                    draws = yield axios.default.post(`https://deckofcardsapi.com/api/deck/${deck.data.deck_id}/draw?count=21`);
                    success = true;
                }
                catch (_a) { }
            }
            const output = draws.data;
            this.players[0].hand = [output.cards[0], output.cards[4], output.cards[8], output.cards[12], output.cards[16]];
            this.players[1].hand = [output.cards[1], output.cards[5], output.cards[9], output.cards[13], output.cards[17]];
            this.players[2].hand = [output.cards[2], output.cards[6], output.cards[10], output.cards[14], output.cards[18]];
            this.players[3].hand = [output.cards[3], output.cards[7], output.cards[11], output.cards[15], output.cards[19]];
            this.gameState.top = output.cards[20];
            for (const player of this.players) {
                yield this.sendHand(player);
            }
            yield this.sendCards([this.gameState.top], 'Top of Stack:');
            const playerUsers = [];
            for (const player of this.players) {
                playerUsers.push(player);
            }
            for (const player of this.players) {
                const response = yield this.askPlayer(player.user, `Would you like to pass or have ${this.players[3].user.username} pick it up?`, ['Pick it up', 'Pass']);
                if (response === 0) {
                    this.gameState.trump = this.gameState.top.suit;
                    this.players[3].hand[yield this.askPlayer(this.players[3].user, 'What card would you like to replace?', this.getCardNames(this.players[3].hand))] = this.gameState.top;
                    this.sendHand(this.players[3]);
                    if ((yield this.askPlayer(player.user, 'Would you like to go alone?', ['Yes', 'No'])) === 0) {
                        switch (player.id) {
                            case 0:
                                playerUsers.splice(2, 1);
                                break;
                            case 1:
                                playerUsers.splice(3, 1);
                                break;
                            case 2:
                                playerUsers.splice(0, 1);
                                break;
                            case 3:
                                playerUsers.splice(1, 1);
                                break;
                        }
                        yield this.tricks(playerUsers, player.team, true);
                        return;
                    }
                    yield this.tricks(playerUsers, player.team, false);
                    return;
                }
            }
            const availableSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades', 'Pass'];
            availableSuits.splice(availableSuits.indexOf(`${this.gameState.top.suit[0]}${this.gameState.top.suit.slice(1).toLowerCase()}`), 1);
            for (const [i, player] of this.players.entries()) {
                if (i === 3) {
                    availableSuits.splice(availableSuits.length - 1, 1);
                }
                const response = yield this.askPlayer(player.user, 'What would you like to be trump?', availableSuits);
                if (response !== 3) {
                    this.gameState.trump = availableSuits[response].toUpperCase();
                    if ((yield this.askPlayer(player.user, 'Would you like to go alone?', ['Yes', 'No'])) === 0) {
                        switch (player.id) {
                            case 0:
                                playerUsers.splice(2, 1);
                                break;
                            case 1:
                                playerUsers.splice(3, 1);
                                break;
                            case 2:
                                playerUsers.splice(0, 1);
                                break;
                            case 3:
                                playerUsers.splice(1, 1);
                                break;
                        }
                        yield this.tricks(playerUsers, player.team, true);
                        return;
                    }
                    yield this.tricks(playerUsers, player.team, false);
                    return;
                }
            }
        });
    }
    tricks(activePlayers, leader, solo) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let r = 0; r < 5; r++) {
                const table = [];
                let lead;
                for (const player of activePlayers) {
                    yield this.sendHand(player);
                    if (!lead && table.length > 0) {
                        lead = table[0].suit;
                    }
                    let availableHand = [];
                    const handIndices = [];
                    let hasLead = false;
                    if (lead) {
                        for (const [i, card] of player.hand.entries()) {
                            if (this.realSuit(card) === lead) {
                                availableHand.push(card);
                                handIndices.push(i);
                                hasLead = true;
                            }
                        }
                        if (!hasLead) {
                            availableHand = player.hand;
                            for (let i = 0; i < availableHand.length; i++) {
                                handIndices.push(i);
                            }
                        }
                    }
                    else {
                        availableHand = player.hand;
                        for (let i = 0; i < availableHand.length; i++) {
                            handIndices.push(i);
                        }
                    }
                    const response = yield this.askPlayer(player.user, 'What would you like to play?', this.getCardNames(availableHand));
                    table.push(availableHand[response]);
                    player.hand.splice(handIndices[response], 1);
                    yield this.sendHand(player);
                    yield this.sendCards(table, 'Table:');
                }
                let leadingPlayer;
                let leadingScore = 0;
                for (const [i, card] of table.entries()) {
                    if (this.realSuit(card) === this.gameState.trump) {
                        switch (card.code[0]) {
                            case '9':
                                if (7 > leadingScore) {
                                    leadingScore = 7;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case '10':
                                if (8 > leadingScore) {
                                    leadingScore = 8;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'Q':
                                if (9 > leadingScore) {
                                    leadingScore = 9;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'K':
                                if (10 > leadingScore) {
                                    leadingScore = 10;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'A':
                                if (11 > leadingScore) {
                                    leadingScore = 11;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'J':
                                if (this.realSuit(card) === card.suit && 13 > leadingScore) {
                                    leadingScore = 13;
                                    leadingPlayer = activePlayers[i];
                                }
                                else if (12 > leadingScore) {
                                    leadingScore = 12;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                        }
                    }
                    else if (card.suit === lead) {
                        switch (card.code[0]) {
                            case '9':
                                if (1 > leadingScore) {
                                    leadingScore = 1;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case '10':
                                if (2 > leadingScore) {
                                    leadingScore = 2;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'J':
                                if (3 > leadingScore) {
                                    leadingScore = 3;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'Q':
                                if (4 > leadingScore) {
                                    leadingScore = 4;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'K':
                                if (5 > leadingScore) {
                                    leadingScore = 5;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                            case 'A':
                                if (6 > leadingScore) {
                                    leadingScore = 6;
                                    leadingPlayer = activePlayers[i];
                                }
                                break;
                        }
                    }
                }
                if (leadingPlayer.id % 2 === 0) {
                    this.team1.tricks++;
                }
                else {
                    this.team2.tricks++;
                }
                const tricksWon = genericEmbedResponse('Tricks Won:');
                tricksWon.addField('Team 1:', this.team1.tricks);
                tricksWon.addField('Team 2:', this.team2.tricks);
                for (const player of this.players) {
                    const channel = yield player.user.createDM();
                    yield channel.send(tricksWon);
                }
            }
            /* POTENTIAL SCORES
            * basic (1)
            * euch (2)
            * sweep (2)
            * solo sweep (4)
            */
            let winningTeam;
            if (this.team1.tricks > this.team2.tricks) {
                winningTeam = this.team1;
            }
            else {
                winningTeam = this.team2;
            }
            if (winningTeam === leader) {
                if (winningTeam.tricks === 5) {
                    if (solo) {
                        winningTeam.score += 4;
                    }
                    else {
                        winningTeam.score += 2;
                    }
                }
                else {
                    winningTeam.score++;
                }
            }
            else {
                winningTeam.score += 2;
            }
            const standings = genericEmbedResponse('Tricks Won:');
            standings.addField('Team 1:', this.team1.score);
            standings.addField('Team 2:', this.team2.score);
            for (const player of this.players) {
                const channel = yield player.user.createDM();
                yield channel.send(standings);
            }
        });
    }
    //used to check for left bower
    realSuit(card) {
        if (card.code[0] !== 'J') {
            return card.suit;
        }
        switch (card.suit) {
            case 'CLUBS':
                if (this.gameState.trump === 'SPADES') {
                    return 'SPADES';
                }
                break;
            case 'SPADES':
                if (this.gameState.trump === 'CLUBS') {
                    return 'CLUBS';
                }
                break;
            case 'HEARTS':
                if (this.gameState.trump === 'DIAMONDS') {
                    return 'DIAMOND';
                }
                break;
            case 'DIAMONDS':
                if (this.gameState.trump === 'HEARTS') {
                    return 'HEARTS';
                }
                break;
        }
        return card.suit;
    }
    getCardNames(hand) {
        const names = [];
        for (const card of hand) {
            names.push(`${card.value[0]}${card.value.slice(1).toLowerCase()} of ${card.suit[0]}${card.suit.slice(1).toLowerCase()}`);
        }
        return names;
    }
    askPlayer(player, question, responses) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield player.createDM();
            const prompt = genericEmbedResponse(question);
            for (let i = 0; i < responses.length; i++) {
                prompt.addField(`${(i + 1)}. `, responses[i]);
            }
            const message = yield channel.send(prompt);
            const emojiList = ['1\ufe0f\u20e3', '2\ufe0f\u20e3', '3\ufe0f\u20e3', '4\ufe0f\u20e3', '5\ufe0f\u20e3', '6\ufe0f\u20e3', '7\ufe0f\u20e3', '8\ufe0f\u20e3', '9\ufe0f\u20e3', '\ud83d\udd1f'];
            for (let i = 0; i < responses.length; i++) {
                yield message.react(emojiList[i]);
            }
            function filter(reaction) { return reaction.client === client; }
            const reaction = yield message.awaitReactions(filter, { max: 1 });
            const reactionResult = reaction.first();
            for (let i = 0; i < emojiList.length; i++) {
                if (reactionResult.emoji.name === emojiList[i]) {
                    return i;
                }
            }
        });
    }
    sendHand(player) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePaths = [];
            const hand = genericEmbedResponse('^ Your Hand:');
            for (const card of player.hand) {
                filePaths.push(`${root}/assets/img/cards/${card.code}.png`);
            }
            if (filePaths.length === 1) {
                hand.attachFiles([{
                        attachment: filePaths[0],
                        name: 'hand.png'
                    }]);
                const channel = yield player.user.createDM();
                yield channel.send(hand);
                return;
            }
            const image = yield mergeImages(filePaths, {
                width: filePaths.length * 226,
                height: 314
            });
            hand.attachFiles([{
                    attachment: image,
                    name: 'hand.png'
                }]);
            const channel = yield player.user.createDM();
            yield channel.send(hand);
        });
    }
    sendCards(cards, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = genericEmbedResponse(`^ ${message}`);
            const filePaths = [];
            for (let i = 0; i < cards.length; i++) {
                filePaths.push(`${root}/assets/img/cards/${cards[i].code}.png`);
            }
            const image = yield mergeImages(filePaths, {
                width: filePaths.length * 226,
                height: 314
            });
            response.attachFiles([{
                    attachment: image,
                    name: `${message}.png`
                }]);
            for (const player of this.players) {
                const channel = yield player.user.createDM();
                yield channel.send(response);
            }
        });
    }
}
// This block executes when someone's voice state changes
client.on('voiceStateUpdate', (oldState, newState) => {
    var _a, _b;
    if (oldState.id !== client.user.id) {
        return;
    }
    if (oldState.channelID && oldState.channelID !== newState.channelID && ((_b = (_a = guildStatus[oldState.guild.id]) === null || _a === void 0 ? void 0 : _a.voice) === null || _b === void 0 ? void 0 : _b.dispatcher)) {
        guildStatus[oldState.guild.id].queue = [];
        guildStatus[oldState.guild.id].downloadQueue = [];
        guildStatus[oldState.guild.id].voice.dispatcher.destroy();
        guildStatus[oldState.guild.id].audio = false;
        guildStatus[oldState.guild.id].singleLoop = false;
        guildStatus[oldState.guild.id].fullLoop = false;
        guildStatus[oldState.guild.id].voice.disconnect();
    }
});
// This block executes when the bot is launched
client.on('ready', () => {
    console.log(`We have logged in as ${client.user.tag}`);
    // Removes the temp folder if it exists
    /*if (fs.existsSync(`${home}/temp`)) {
        fs.rmdirSync(`${home}/temp`, { recursive: true })
    }

    fs.mkdirSync(`${home}/temp`) // Creates a temp folder for this session*/
    client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)]); // Sets bot status
    // Fetches any necessary user objects
    getUser('619975185029922817', '609826125501169723')
        .then(admin => { users.admin = admin.user; });
    getUser('619975185029922817', '633046187506794527')
        .then(swear => { users.swear = swear.user; });
    // Defines tasks that must be executed periodically
    setInterval(function () {
        userData = refreshData(`${home}/sys_files/bots.json`); // Refresh user data variable
        client.user.setActivity(sysData.potatoStatus[Math.floor(Math.random() * sysData.potatoStatus.length)]); // Reset bot status
        // Disconnects bot if it is inactive in a voice channel
        for (const guild in guildStatus) {
            if (!guildStatus[guild].audio && guildStatus[guild].voice) {
                guildStatus[guild].voice.disconnect();
            }
        }
    }, 60000); // Defines the time between executions in ms
});
// Functions for specific commands
function wynncraftStats(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.content.split(" ").length < 2) {
            msg.reply('Please enter a player username');
            return;
        }
        const f = yield makeGetRequest(`https://api.wynncraft.com/v2/player/${msg.content.split(" ")[1]}/stats`);
        let current;
        let playtimeStr;
        let hPlaytimeStr;
        const embedVar = new Discord.MessageEmbed();
        embedVar.setTitle(f.data[0].username);
        if (f.data[0].meta.location.online) {
            current = `Online at: ${f.data[0].meta.location.server}`;
            embedVar.setColor(0x33cc33);
        }
        else {
            current = 'Offline';
            embedVar.setColor(0xff0000);
        }
        embedVar.addField('Current Status', current);
        for (let i = 0; i < f.data[0].classes.length; i++) {
            let playtime = f.data[0].classes[i].playtime;
            const hPlaytime = Math.floor(playtime / 60);
            playtime = playtime % 60;
            if (playtime < 10) {
                playtimeStr = `0${playtime}`;
            }
            else {
                playtimeStr = playtime.toString();
            }
            if (hPlaytime < 10) {
                hPlaytimeStr = `0${hPlaytime}`;
            }
            else {
                hPlaytimeStr = hPlaytime.toString();
            }
            embedVar.addField(`Profile ${(i + 1)}`, `Class: ${f.data[0].classes[i].name}\nPlaytime: ${hPlaytimeStr}:${playtimeStr}\nCombat Level: ${f.data[0].classes[i].professions.combat.level}`);
        }
        msg.reply(embedVar);
    });
}
function newSwearSong(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.author !== users.admin && msg.author !== users.swear) {
            msg.reply('You don\'t have permission to use this command!');
            return;
        }
        if (msg.content.split(" ").length < 2) {
            msg.reply('Please enter a video url');
            return;
        }
        msg.channel.send('Getting information on new song...');
        const output = yield youtubedl(msg.content.split(" ")[1], {
            dumpJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            ignoreErrors: true
        });
        try {
            if ('entries' in output) {
                msg.reply('Please only enter a single video at a time');
                return;
            }
            if (output.duration > 1200) {
                msg.reply('The video length limit is 20 minutes! Aborting...');
                return;
            }
        }
        catch (_a) {
            msg.reply('It appears the video was unavailable');
            return;
        }
        msg.channel.send('Downloading...');
        youtubedl(msg.content.split(" ")[1], {
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            format: 'bestaudio',
            output: `${home}/music_files/swear_songs/song${userData.swearSongs.length + 1}.mp3`
        });
        userData = refreshData(`${home}/sys_files/bots.json`);
        userData.swearSongs.push(`song${(userData.swearSongs.length + 1)}.mp3`);
        const jsonString = JSON.stringify(userData);
        fs.writeFileSync(`${home}/sys_files/bots.json`, jsonString);
        msg.reply('Success!');
    });
}
function downloadVideo(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.author !== users.admin) {
            msg.reply('You don\'t have permission to use this command!');
            return;
        }
        if (msg.content.split(" ").length < 2) {
            msg.reply('Please enter a video url');
            return;
        }
        const options = {
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            format: 'bestaudio',
            output: `${home}/New Downloads/%(title)s.%(ext)s`,
            ignoreErrors: true
        };
        if (msg.content.split(" ").length < 3 || msg.content.split(" ")[2][0].toLowerCase() !== 'a') {
            options.format = 'bestvideo,bestaudio';
        }
        msg.channel.send('Downloading...');
        yield youtubedl(msg.content.split(" ")[1], options);
        msg.reply('Download Successful!');
    });
}
function play(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let url;
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) {
            msg.reply('This command can only be used while in a voice channel!');
            return;
        }
        if (!voiceChannel.joinable) {
            msg.reply('I can\'t join this voice channel!');
            return;
        }
        try {
            url = msg.content.split(" ")[1];
        }
        catch (_a) {
            msg.reply('Please enter a video url when using this command');
            return;
        }
        switch (url.toLowerCase()) {
            case 'epic':
                url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2';
                break;
            case 'magic':
                url = 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl';
                break;
            case 'undertale':
                url = 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x';
                break;
            case 'fun':
                url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD';
                break;
            case 'bully':
                url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_';
                break;
            case 'starwars':
                url = 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk';
                break;
        }
        msg.channel.send('Boiling potatoes...');
        let output;
        if (url.split(/[?&]+/)[1].startsWith('list') || !fs.existsSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`)) {
            try {
                output = yield youtubedl(url, {
                    dumpSingleJson: true,
                    noWarnings: true,
                    noCallHome: true,
                    noCheckCertificate: true,
                    preferFreeFormats: true,
                    youtubeSkipDashManifest: true,
                    ignoreErrors: true,
                    geoBypass: true,
                    noPlaylist: true,
                    flatPlaylist: true
                });
            }
            catch (err) {
                console.log(err);
                msg.reply('Please enter a valid url');
                return;
            }
        }
        else {
            output = JSON.parse(fs.readFileSync(`${home}/music_files/playback/${url.split(/[?&]+/)[1].substring(3)}.json`, { encoding: 'utf8' }));
        }
        function addToQueue(duration, webpageUrl, title, id, thumbnail) {
            if (duration < 5400) {
                guildStatus[msg.guild.id].queue.push({
                    webpageUrl: webpageUrl,
                    title: title,
                    id: id,
                    thumbnail: thumbnail,
                    duration: duration
                });
                if (!thumbnail) {
                    guildStatus[msg.guild.id].downloadQueue.push(webpageUrl);
                    if (!guildStatus[msg.guild.id].downloading) {
                        download(msg.guild.id);
                    }
                }
                return;
            }
            msg.reply(`${title} is longer than 20 minutes and cannot be added to queue`);
        }
        if ('entries' in output) {
            for (const entry of output.entries) {
                let data;
                if (fs.existsSync(`${home}/music_files/playback/${entry.id}.json`)) {
                    data = JSON.parse(fs.readFileSync(`${home}/music_files/playback/${entry.id}.json`, { encoding: 'utf8' }));
                }
                else {
                    data = entry;
                }
                addToQueue(data.duration, `https://www.youtube.com/watch?v=${data.id}`, data.title, data.id, data === null || data === void 0 ? void 0 : data.thumbnail);
            }
        }
        else {
            addToQueue(output.duration, output.webpage_url, output.title, output.id, output === null || output === void 0 ? void 0 : output.thumbnail);
        }
        msg.reply('Added to queue!');
        if (!guildStatus[msg.guild.id].audio) {
            guildStatus[msg.guild.id].singleLoop = false;
            guildStatus[msg.guild.id].fullLoop = false;
            playQueue(msg.channel, msg.guild.id, voiceChannel);
        }
    });
}
function displayQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (guildStatus[msg.guild.id].queue.length < 1) {
            msg.reply('There is no queue!');
            return;
        }
        const queueArray = [];
        for (let r = 0; r < Math.ceil(guildStatus[msg.guild.id].queue.length / 25); r++) {
            queueArray.push([]);
            for (let i = 0; i < 25; i++) {
                if ((r * 25) + i > guildStatus[msg.guild.id].queue.length - 1) {
                    break;
                }
                queueArray[r].push(guildStatus[msg.guild.id].queue[(r * 25) + i]);
            }
        }
        function sendQueue(index) {
            return __awaiter(this, void 0, void 0, function* () {
                const queueMessage = genericEmbedResponse('Queue');
                for (const [i, entry] of queueArray[index].entries()) {
                    queueMessage.addField(`${i + 1}.`, `${entry.title}\n${entry.webpageUrl}`);
                }
                if (guildStatus[msg.guild.id].fullLoop) {
                    queueMessage.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png');
                }
                const message = yield msg.channel.send(queueMessage);
                const emojiList = ['\u274C'];
                if (index > 0) {
                    emojiList.unshift('\u2B05\uFE0F');
                }
                if (index < queueArray.length - 1) {
                    emojiList.push('\u27A1\uFE0F');
                }
                for (const emoji of emojiList) {
                    yield message.react(emoji);
                }
                function filter(reaction) { return reaction.client === client; }
                const reaction = yield message.awaitReactions(filter, { max: 1 });
                const reactionResult = reaction.first();
                switch (reactionResult.emoji.name) {
                    case '\u2B05\uFE0F':
                        yield message.delete();
                        sendQueue(index - 1);
                        break;
                    case '\u27A1\uFE0F':
                        yield message.delete();
                        sendQueue(index + 1);
                        break;
                    default:
                        message.delete();
                        return;
                }
            });
        }
        sendQueue(0);
    });
}
function setupEuchre(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const player1 = yield msg.guild.members.fetch({ query: msg.content.split(" ")[1], limit: 1 });
        const player2 = yield msg.guild.members.fetch({ query: msg.content.split(" ")[2], limit: 1 });
        const player3 = yield msg.guild.members.fetch({ query: msg.content.split(" ")[3], limit: 1 });
        const player4 = yield msg.guild.members.fetch({ query: msg.content.split(" ")[4], limit: 1 });
        const players = genericEmbedResponse('Teams');
        players.addField('Team 1:', `${player1.first().user.username}, ${player3.first().user.username}`);
        players.addField('Team 2:', `${player2.first().user.username}, ${player4.first().user.username}`);
        msg.channel.send(players);
        const game = new Euchre([player1.first().user, player2.first().user, player3.first().user, player4.first().user]);
        const results = yield game.startGame();
        msg.channel.send(results);
    });
}
// This block executes when a message is sent
client.on('message', msg => {
    var _a, _b, _c;
    // If message is not in a guild return
    if (!msg.guild) {
        return;
    }
    // Creates a key in GuildStatus for the current guild
    if (!(msg.guild.id in guildStatus)) {
        guildStatus[msg.guild.id] = {
            audio: false,
            queue: [],
            downloadQueue: [],
            voice: null,
            downloading: false,
            nowPlaying: null,
            fullLoop: false,
            singleLoop: false
        };
        //fs.mkdirSync(`${home}/temp/${msg.guild.id}`)
    }
    if (msg.author.bot) {
        // Disconnects rythm bot if it attempts to play a rickroll
        if (msg.content.indexOf('Never Gonna Give You Up') !== -1) {
            voiceKick(0, msg.member.voice);
        }
        return; // Message is ignored if sent from a bot
    }
    // Checks if message contains swears or insults potatoes
    if (!msg.content.startsWith(prefix)) {
        let mentionPotato = false;
        let mentionSwear = false;
        let mentionInsult = false;
        for (const word of msg.content.toLowerCase().split(" ")) {
            if (word.indexOf('potato') !== -1) {
                mentionPotato = true;
            }
            for (const swear of sysData.blacklist.swears) {
                if (word === swear) {
                    mentionSwear = true;
                    break;
                }
            }
            for (const insult of sysData.blacklist.insults) {
                if (word === insult) {
                    mentionInsult = true;
                    break;
                }
            }
        }
        if (mentionPotato && (mentionSwear || mentionInsult)) {
            msg.reply('FOOL! HOW DARE YOU BLASPHEMISE THE HOLY ORDER OF THE POTATOES! EAT POTATOES!', { 'tts': true });
            client.user.setActivity(`Teaching ${msg.author.tag} the value of potatoes`, {
                type: 'STREAMING',
                url: 'https://www.youtube.com/watch?v=fLNWeEen35Y'
            });
        }
        else if (mentionSwear) {
            for (let i = 0; i < 3; i++) {
                msg.channel.send('a');
            }
        }
        return;
    }
    const msgBody = msg.content.split(" ")[0].slice(1).toLowerCase();
    try {
        // Determines which command was sent
        switch (msgBody) {
            case 'wynncraft':
                wynncraftStats(msg);
                break;
            case 'newsong':
                newSwearSong(msg);
                break;
            case 'download':
                downloadVideo(msg);
                break;
            case 'play':
                play(msg);
                break;
            case 'pause':
                if (!((_a = guildStatus[msg.guild.id].voice) === null || _a === void 0 ? void 0 : _a.dispatcher)) {
                    msg.reply('Nothing is playing!');
                    return;
                }
                guildStatus[msg.guild.id].voice.dispatcher.pause(true);
                msg.reply('Paused!');
                break;
            case 'resume':
                if (!((_b = guildStatus[msg.guild.id].voice) === null || _b === void 0 ? void 0 : _b.dispatcher)) {
                    msg.reply('Nothing is playing!');
                }
                guildStatus[msg.guild.id].voice.dispatcher.resume();
                msg.reply('Resumed!');
                break;
            case 'loop':
                if (!guildStatus[msg.guild.id].nowPlaying) {
                    msg.reply('Nothing is playing!');
                    return;
                }
                if (guildStatus[msg.guild.id].singleLoop) {
                    guildStatus[msg.guild.id].singleLoop = false;
                    guildStatus[msg.guild.id].nowPlaying.setFooter('');
                    msg.reply('No longer looping');
                    return;
                }
                guildStatus[msg.guild.id].singleLoop = true;
                guildStatus[msg.guild.id].fullLoop = false;
                guildStatus[msg.guild.id].nowPlaying.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png');
                msg.reply('Now looping!');
                break;
            case 'loopqueue':
                if (guildStatus[msg.guild.id].queue.length < 1) {
                    msg.reply('There is no queue to loop!');
                    return;
                }
                if (guildStatus[msg.guild.id].fullLoop) {
                    guildStatus[msg.guild.id].fullLoop = false;
                    msg.reply('No longer looping queue');
                    return;
                }
                guildStatus[msg.guild.id].fullLoop = true;
                guildStatus[msg.guild.id].singleLoop = false;
                msg.reply('Now looping queue!');
                break;
            case 'queue':
                displayQueue(msg);
                break;
            case 'clear':
                if (guildStatus[msg.guild.id].queue.length < 1) {
                    msg.reply('There is no queue!');
                    return;
                }
                guildStatus[msg.guild.id].queue = [];
                guildStatus[msg.guild.id].fullLoop = false;
                msg.reply('The queue has been cleared!');
                break;
            case 'skip':
                if (!guildStatus[msg.guild.id].audio) {
                    msg.reply('There is nothing to skip');
                    return;
                }
                guildStatus[msg.guild.id].voice.dispatcher.destroy();
                guildStatus[msg.guild.id].singleLoop = false;
                playQueue(msg.channel, msg.guild.id, guildStatus[msg.guild.id].voice.channel);
                msg.reply('Skipped!');
                break;
            case 'shuffle': //change to shuffle option when adding to queue (async downloading is easier)
                if (guildStatus[msg.guild.id].queue.length < 1) {
                    msg.reply('There is no queue!');
                    return;
                }
                guildStatus[msg.guild.id].queue.sort(() => Math.random() - 0.5);
                msg.reply('The queue has been shuffled');
                break;
            case 'stop':
                if (!((_c = guildStatus[msg.guild.id].voice) === null || _c === void 0 ? void 0 : _c.dispatcher)) {
                    msg.reply('There is nothing playing!');
                    return;
                }
                guildStatus[msg.guild.id].queue = [];
                guildStatus[msg.guild.id].downloadQueue = [];
                guildStatus[msg.guild.id].voice.dispatcher.destroy();
                guildStatus[msg.guild.id].audio = false;
                guildStatus[msg.guild.id].singleLoop = false;
                guildStatus[msg.guild.id].fullLoop = false;
                guildStatus[msg.guild.id].voice.disconnect();
                msg.reply('Success');
                break;
            case 'np':
                if (!guildStatus[msg.guild.id].nowPlaying) {
                    msg.reply('Nothing has played yet!');
                    return;
                }
                msg.reply(guildStatus[msg.guild.id].nowPlaying);
                break;
            case 'playlists':
                const playlists = genericEmbedResponse('Playlists');
                playlists.addField('Epic Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2');
                playlists.addField('Undertale Mix', 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x');
                playlists.addField('MTG Parodies', 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl');
                playlists.addField('Bully Maguire', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_');
                playlists.addField('Star Wars Parodies', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk');
                playlists.addField('Fun Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD');
                msg.reply(playlists);
                break;
            case 'quote':
                const quotes = fs.readFileSync(`${home}/sys_files/quotes.txt`, 'utf8').split("}");
                msg.channel.send(quotes[Math.floor(Math.random() * quotes.length)], { 'tts': true });
                break;
            case 'euchre':
                setupEuchre(msg);
                break;
        }
    }
    catch (err) {
        console.log(err);
    }
});
client.login(sysData.potatoKey);
//# sourceMappingURL=app.js.map