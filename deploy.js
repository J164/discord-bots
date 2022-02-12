import { Client, Intents } from 'discord.js';
import { readdirSync } from 'node:fs';
import process from 'node:process';

const crystal = new Client({ intents: Intents.FLAGS.GUILDS });
const crystalDeploy = new Promise((resolve) => {
    crystal.once('ready', async () => {
        const commandData = [];
        for (const slash of readdirSync('./dist/commands/crystal').filter(file => file.endsWith('.js'))) {
            const { command } = await import(`./dist/commands/crystal/${slash}`);
            commandData.push(command.data);
        }
        await crystal.application.commands.set(commandData);
        resolve();
    });
});

const potato = new Client({ intents: Intents.FLAGS.GUILDS });
const potatoDeploy = new Promise((resolve) => {
    potato.once('ready', async () => {
        const commandData = [];
        for (const slash of readdirSync('./dist/commands/potato').filter(file => file.endsWith('.js'))) {
            const { command } = await import(`./dist/commands/potato/${slash}`);
            commandData.push(command.data);
        }
        await potato.application.commands.set(commandData);
        resolve();
    });
});

const swear = new Client({ intents: Intents.FLAGS.GUILDS });
const swearDeploy = new Promise((resolve) => {
    swear.once('ready', async () => {
        const commandData = [];
        for (const slash of readdirSync('./dist/commands/swear').filter(file => file.endsWith('.js'))) {
            const { command } = await import(`./dist/commands/swear/${slash}`);
            commandData.push(command.data);
        }
        await swear.application.commands.set(commandData);
        resolve();
    });
});

const yeet = new Client({ intents: Intents.FLAGS.GUILDS });
const yeetDeploy = new Promise((resolve) => {
    yeet.once('ready', async () => {
        const commandData = [];
        for (const slash of readdirSync('./dist/commands/yeet').filter(file => file.endsWith('.js'))) {
            const { command } = await import(`./dist/commands/yeet/${slash}`);
            commandData.push(command.data);
        }
        await yeet.application.commands.set(commandData);
        resolve();
    });
});

crystal.login(process.env.CRYSTALTOKEN);
potato.login(process.env.POTATOTOKEN);
swear.login(process.env.SWEARTOKEN);
yeet.login(process.env.YEETTOKEN);

await Promise.all([crystalDeploy, potatoDeploy, swearDeploy, yeetDeploy]);
console.log('Done!');
process.exit();