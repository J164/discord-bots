"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on('uncaughtException', err => {
    console.log(err);
    setInterval(function () { }, 1000);
});
const Discord = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const intents = ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'];
let client = new Discord.Client({ ws: { intents: intents } });
const prefix = '$';
const home = 'D:/Bot Resources';
const root = 'C:/Users/jacob/OneDrive/Documents/Master Discord Bots/';
const sysData = JSON.parse(fs.readFileSync(`${root}/assets/static/static.json`, { encoding: 'utf8' }));
let userData = JSON.parse(fs.readFileSync(`${home}/sys_files/bots.json`, { encoding: 'utf8' }));
let guildStatus = {}; // Stores guild specific information to allow bot to act independent in different guilds
function refreshData(location) {
    const jsonString = fs.readFileSync(location, { encoding: 'utf8' });
    return JSON.parse(jsonString);
}
function genericEmbedResponse(title) {
    const embedVar = new Discord.MessageEmbed();
    embedVar.setTitle(title);
    embedVar.setColor(0xffff00);
    return embedVar;
}
async function makeGetRequest(path) {
    const response = await axios.default.get(path);
    return response.data;
}
function findKey(object, property) {
    let result;
    if (object instanceof Array) {
        for (let i = 0; i < object.length; i++) {
            result = findKey(object[i], property);
            if (result) {
                break;
            }
        }
    }
    else {
        for (const prop in object) {
            if (prop === property) {
                if (object[prop]) {
                    return object;
                }
            }
            if (object[prop] instanceof Object || object[prop] instanceof Array) {
                result = findKey(object[prop], property);
                if (result) {
                    break;
                }
            }
        }
    }
    return result;
}
class Deck {
    fill(json) {
        this.image = json.image;
        this.name = json.name;
        this.url = json.url;
        this.apiUrl = json.apiUrl;
    }
    async getInfo(url) {
        this.url = url;
        let authorID;
        let deckID;
        try {
            const fields = url.split('/');
            authorID = fields[4];
            deckID = fields[5].split('-')[0];
        }
        catch {
            return false;
        }
        this.apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${authorID}&id=${deckID}&response_type=`;
        let deckJson;
        try {
            deckJson = await makeGetRequest(this.apiUrl + 'json');
        }
        catch {
            return false;
        }
        for (const deck of userData.decks) {
            if (deck.name === deckJson.name) {
                return false;
            }
        }
        this.name = deckJson.name;
        let commander = findKey(deckJson, 'isCommander');
        commander = commander.name;
        const cardInfo = await makeGetRequest(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(commander)}`);
        this.image = cardInfo.data[0].image_uris.large;
        return true;
    }
    getPreview() {
        const preview = genericEmbedResponse(this.name);
        preview.setImage(this.image);
        preview.addField('Deckstats URL:', this.url);
        return preview;
    }
    async getList() {
        const decklist = await makeGetRequest(this.apiUrl + 'list');
        const decklistArray = decklist.list.split("\n");
        for (let i = 0; i < decklistArray.length; i++) {
            if (!decklistArray[i] || decklistArray[i].startsWith('//')) {
                decklistArray.splice(i, 1);
                i--;
                continue;
            }
            if (decklistArray[i].indexOf('//') !== -1) {
                decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('//'));
            }
            if (decklistArray[i].indexOf('#') !== -1) {
                decklistArray[i] = decklistArray[i].substr(0, decklistArray[i].indexOf('#'));
            }
        }
        return '\n' + decklistArray.join('\n');
    }
}
class MagicGame {
    constructor(playerList) {
        this.numAlive = playerList.length;
        this.playerInfo = {};
        for (const player of playerList) {
            this.playerInfo[player.id] = {
                playerName: player.user.username,
                lifeTotal: 20,
                poison: 0,
                isAlive: true
            };
        }
    }
    changeLife(player, amount) {
        this.playerInfo[player].lifeTotal += amount;
        return this.checkStatus(player);
    }
    addPoison(player, amount) {
        this.playerInfo[player].poison += amount;
        return this.checkStatus(player);
    }
    checkStatus(player) {
        if (this.playerInfo[player].lifeTotal < 1 || this.playerInfo[player].poison >= 10) {
            return this.eliminate(player);
        }
        return this.printStandings();
    }
    eliminate(player) {
        this.playerInfo[player].isAlive = false;
        this.numAlive--;
        if (this.numAlive < 2) {
            return this.finishGame();
        }
        return this.printStandings();
    }
    printStandings() {
        const embedVar = genericEmbedResponse('Current Standings');
        for (const player of this.playerInfo) {
            if (player.isAlive) {
                embedVar.addField(`${player.playerName}:`, `Life Total: ${player.lifeTotal}\nPoison Counters: ${player.poison}`);
            }
            else {
                embedVar.addField(`${player.playerName}:`, 'ELIMINATED');
            }
        }
        return embedVar;
    }
    finishGame() {
        for (const player of this.playerInfo) {
            if (player.isAlive) {
                const embedVar = genericEmbedResponse(`${player.playerName} Wins!!`);
                embedVar.addField(`${player.playerName}:`, `Life Total: ${player.lifeTotal}\nPoison Counters: ${player.poison}`);
                return embedVar;
            }
        }
    }
}
/*class CommanderGame extends MagicGame {
    constructor(playerList: Discord.GuildMember[], commanderList: string[]) {
        super(playerList)
        //Make changes for commander (life total, times commander cast, commander damage)
    }

    changeLife(player: Discord.Snowflake, amount: number, commander: string = null) {

    }

    checkStatus(player: Discord.Snowflake) {
        
    }

    printStandings() {

    }

    addCast(commander: string) {

    }

    getCasts(commander: string) {

    }
}*/
async function add(msg) {
    if (msg.content.split(" ").length < 2) {
        msg.reply('Please enter a deckstats URL!');
        return;
    }
    const deck = new Deck();
    if (await deck.getInfo(msg.content.split(" ")[1])) {
        userData = refreshData(`${home}/sys_files/bots.json`);
        userData.decks.push(deck);
        const jsonString = JSON.stringify(userData);
        fs.writeFileSync(`${home}/sys_files/bots.json`, jsonString);
        msg.reply('Success!');
        return;
    }
    msg.reply('Something went wrong... (Make sure you are using a valid deck url from deckstats.net and that the deck is not a duplicate)');
}
async function deckPreview(i, msg) {
    const deck = new Deck();
    deck.fill(userData.decks[i]);
    const message = await msg.channel.send(deck.getPreview());
    const emojiList = ['\uD83D\uDCC4', '\u274C']; // Page and X emoji
    if (i !== 0) {
        emojiList.unshift('\u2B05\uFE0F'); // Left arrow
    }
    if (i !== (userData.decks.length - 1)) {
        emojiList.push('\u27A1\uFE0F'); // Right arrow
    }
    for (const emoji of emojiList) {
        await message.react(emoji);
    }
    function filter(reaction) { return reaction.client === client; }
    const reaction = await message.awaitReactions(filter, { max: 1 });
    const reactionResult = reaction.first();
    switch (reactionResult.emoji.name) {
        case '\uD83D\uDCC4':
            const deckList = await deck.getList();
            msg.reply(deckList);
            message.delete();
            return;
        case '\u274C':
            message.delete();
            return;
        case '\u2B05\uFE0F':
            message.delete();
            deckPreview((i - 1), msg);
            return;
        case '\u27A1\uFE0F':
            message.delete();
            deckPreview((i + 1), msg);
            return;
        default:
            message.delete();
            return;
    }
}
function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`);
        process.send('start');
        client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)]);
        setInterval(function () {
            userData = refreshData(`${home}/sys_files/bots.json`);
            client.user.setActivity(sysData.krenkoStatus[Math.floor(Math.random() * sysData.krenkoStatus.length)]);
        }, 60000);
    });
    client.on('message', msg => {
        if (msg.author.bot || !msg.content.startsWith(prefix) || !msg.guild) {
            return;
        }
        if (!(msg.guild.id in guildStatus)) {
            guildStatus[msg.guild.id] = {
                game: null
            };
        }
        const messageStart = msg.content.split(" ")[0].slice(1).toLowerCase();
        try {
            switch (messageStart) {
                case 'add':
                    add(msg);
                    break;
                case 'decks':
                    deckPreview(0, msg);
                    break;
                case 'roll':
                    let dice = 6;
                    if (msg.content.split(" ").length > 1) {
                        const arg = parseInt(msg.content.split(" ")[1]);
                        if (!isNaN(arg) && arg > 0) {
                            dice = arg;
                        }
                    }
                    msg.channel.send(`Rolling a ${dice}-sided die...`);
                    const diceResult = genericEmbedResponse(`${dice}-sided die result`);
                    let chanceMod = 10000;
                    while ((100 / dice) * chanceMod < 1) {
                        chanceMod *= 10;
                    }
                    diceResult.addField(`${Math.floor((Math.random() * (dice - 1)) + 1)}`, `The chance of getting this result is about ${Math.round((100 / dice) * chanceMod) / chanceMod}%`);
                    msg.reply(diceResult);
                    break;
                case 'flip':
                    const flip = Math.random();
                    const flipResult = genericEmbedResponse('Flip Result:');
                    if (flip >= 0.5) {
                        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png');
                    }
                    else {
                        flipResult.setImage('https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png');
                    }
                    msg.reply(flipResult);
                    break;
                case 'newgame':
                    if (guildStatus[msg.guild.id].game) {
                        msg.reply('A game is already in progress!');
                        return;
                    }
                    //guildStatus[msg.guild.id].game = new MagicGame()
                    break;
                case 'hit':
                    if (!guildStatus[msg.guild.id].game) {
                        msg.reply('There is no active game!');
                        return;
                    }
                    //msg.reply(guildStatus[msg.guild.id].game.changeLife())
                    break;
                case 'heal':
                    if (!guildStatus[msg.guild.id].game) {
                        msg.reply('There is no active game!');
                        return;
                    }
                    //msg.reply(guildStatus[msg.guild.id].game.changeLife()) // multiply number by -1
                    break;
                case 'eliminate':
                    if (!guildStatus[msg.guild.id].game) {
                        msg.reply('There is no active game!');
                        return;
                    }
                    //msg.reply(guildStatus[msg.guild.id].game.eliminate())
                    break;
                case 'poison':
                    if (!guildStatus[msg.guild.id].game) {
                        msg.reply('There is no active game!');
                        return;
                    }
                    //msg.reply(guildStatus[msg.guild.id].game.addPoison())
                    break;
                case 'standings':
                    if (!guildStatus[msg.guild.id].game) {
                        msg.reply('There is no active game!');
                        return;
                    }
                    //msg.reply(guildStatus[msg.guild.id].game.printStandings())
                    break;
                case 'endgame':
                    guildStatus[msg.guild.id].game = null;
                    msg.reply('Success!');
                    break;
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
process.on("message", function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy();
            console.log('Krenko Bot has been logged out');
            process.send('stop');
            break;
        case 'start':
            client = new Discord.Client({ ws: { intents: intents } });
            defineEvents();
            guildStatus = {};
            client.login(sysData.krenkoKey);
            break;
    }
});
//# sourceMappingURL=app.js.map