"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exec = require("child_process");
const readline = require("readline");
const src = '../src';
const potatoBot = {
    process: exec.fork(`${src}/PotatoBot/app.js`),
    online: false
};
const krenkoBot = {
    process: exec.fork(`${src}/KrenkoBot/app.js`),
    online: false
};
const swearBot = {
    process: exec.fork(`${src}/SwearBot/app.js`),
    online: false
};
const yeetBot = {
    process: exec.fork(`${src}/YeetBot/app.js`),
    online: false
};
const consoleInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function sendAll(arg) {
    await potatoBot.process.send(arg);
    await krenkoBot.process.send(arg);
    await swearBot.process.send(arg);
    await yeetBot.process.send(arg);
}
async function startAll() {
    if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
        prompt();
        return;
    }
    if (!potatoBot.online) {
        await potatoBot.process.send('start');
        potatoBot.process.once('message', function (arg) {
            if (arg !== 'start') {
                return;
            }
            potatoBot.online = true;
            if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
                prompt();
            }
        });
    }
    if (!krenkoBot.online) {
        await krenkoBot.process.send('start');
        krenkoBot.process.once('message', function (arg) {
            if (arg !== 'start') {
                return;
            }
            krenkoBot.online = true;
            if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
                prompt();
            }
        });
    }
    if (!swearBot.online) {
        await swearBot.process.send('start');
        swearBot.process.once('message', function (arg) {
            if (arg !== 'start') {
                return;
            }
            swearBot.online = true;
            if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
                prompt();
            }
        });
    }
    if (!yeetBot.online) {
        await yeetBot.process.send('start');
        yeetBot.process.once('message', function (arg) {
            if (arg !== 'start') {
                return;
            }
            yeetBot.online = true;
            if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
                prompt();
            }
        });
    }
}
async function stopAll() {
    if (!potatoBot.online && !krenkoBot.online && !swearBot.online && !yeetBot.online) {
        process.exit();
        return;
    }
    if (potatoBot.online) {
        await potatoBot.process.send('stop');
        potatoBot.process.once('message', function (arg) {
            if (arg !== 'stop') {
                return;
            }
            potatoBot.online = false;
            if (!potatoBot.online && !krenkoBot.online && !swearBot.online && !yeetBot.online) {
                process.exit();
            }
        });
    }
    if (krenkoBot.online) {
        krenkoBot.process.send('stop');
        krenkoBot.process.once('message', function (arg) {
            if (arg !== 'stop') {
                return;
            }
            krenkoBot.online = false;
            if (!potatoBot.online && !krenkoBot.online && !swearBot.online && !yeetBot.online) {
                process.exit();
            }
        });
    }
    if (swearBot.online) {
        swearBot.process.send('stop');
        swearBot.process.once('message', function (arg) {
            if (arg !== 'stop') {
                return;
            }
            swearBot.online = false;
            if (!potatoBot.online && !krenkoBot.online && !swearBot.online && !yeetBot.online) {
                process.exit();
            }
        });
    }
    if (yeetBot.online) {
        yeetBot.process.send('stop');
        yeetBot.process.once('message', function (arg) {
            if (arg !== 'stop') {
                return;
            }
            yeetBot.online = false;
            if (!potatoBot.online && !krenkoBot.online && !swearBot.online && !yeetBot.online) {
                process.exit();
            }
        });
    }
}
function prompt() {
    consoleInterface.question('> ', (input) => {
        const parsedInput = input.split(" ");
        switch (parsedInput[0]) {
            case 'stop':
                if (parsedInput.length < 2) {
                    console.log('This command takes 1 parameter (Bot Name)');
                    break;
                }
                switch (parsedInput[1]) {
                    case 'potato':
                        if (!potatoBot.online) {
                            console.log('Potato Bot is already offline');
                            break;
                        }
                        potatoBot.process.send('stop');
                        potatoBot.process.once('message', function (arg) {
                            if (arg !== 'stop') {
                                return;
                            }
                            potatoBot.online = false;
                            prompt();
                        });
                        return;
                    case 'krenko':
                        if (!krenkoBot.online) {
                            console.log('Krenko Bot is already offline');
                            break;
                        }
                        krenkoBot.process.send('stop');
                        krenkoBot.process.once('message', function (arg) {
                            if (arg !== 'stop') {
                                return;
                            }
                            krenkoBot.online = false;
                            prompt();
                        });
                        return;
                    case 'swear':
                        if (!swearBot.online) {
                            console.log('Swear Bot is already offline');
                            break;
                        }
                        swearBot.process.send('stop');
                        swearBot.process.once('message', function (arg) {
                            if (arg !== 'stop') {
                                return;
                            }
                            swearBot.online = false;
                            prompt();
                        });
                        return;
                    case 'yeet':
                        if (!yeetBot.online) {
                            console.log('Yeet Bot is already offline');
                            break;
                        }
                        yeetBot.process.send('stop');
                        yeetBot.process.once('message', function (arg) {
                            if (arg !== 'stop') {
                                return;
                            }
                            yeetBot.online = false;
                            prompt();
                        });
                        return;
                    case 'all':
                        stopAll();
                        return;
                    default:
                        console.log('Name not recognized');
                        break;
                }
                break;
            case 'start':
                if (parsedInput.length < 2) {
                    console.log('This command takes 1 parameter (Bot Name)');
                    break;
                }
                switch (parsedInput[1]) {
                    case 'potato':
                        if (potatoBot.online) {
                            console.log('Potato Bot is already online');
                            break;
                        }
                        potatoBot.process.send('start');
                        potatoBot.process.once('message', function (arg) {
                            if (arg !== 'start') {
                                return;
                            }
                            potatoBot.online = true;
                            prompt();
                        });
                        return;
                    case 'krenko':
                        if (krenkoBot.online) {
                            console.log('Krenko Bot is already online');
                            break;
                        }
                        krenkoBot.process.send('start');
                        krenkoBot.process.once('message', function (arg) {
                            if (arg !== 'start') {
                                return;
                            }
                            krenkoBot.online = true;
                            prompt();
                        });
                        return;
                    case 'swear':
                        if (swearBot.online) {
                            console.log('Swear Bot is already online');
                            break;
                        }
                        swearBot.process.send('start');
                        swearBot.process.once('message', function (arg) {
                            if (arg !== 'start') {
                                return;
                            }
                            swearBot.online = true;
                            prompt();
                        });
                        return;
                    case 'yeet':
                        if (yeetBot.online) {
                            console.log('Yeet Bot is already online');
                            break;
                        }
                        yeetBot.process.send('start');
                        yeetBot.process.once('message', function (arg) {
                            if (arg !== 'start') {
                                return;
                            }
                            yeetBot.online = true;
                            prompt();
                        });
                        return;
                    case 'all':
                        startAll();
                        return;
                    default:
                        console.log('Name not recognized');
                        break;
                }
                break;
            case 'help':
                console.log('start <name> (start a bot or use "all" to start all of them');
                console.log('stop <name> (stop a bot or use "all" to stop all of them');
                console.log('list (list all bots and their running status');
                break;
            case 'list':
                if (potatoBot.online) {
                    console.log('Potato Bot: ', "\x1b[42m", 'Online', '\x1b[0m');
                }
                else {
                    console.log('Potato Bot: ', "\x1b[41m", 'Offline', '\x1b[0m');
                }
                if (krenkoBot.online) {
                    console.log('Krenko Bot: ', "\x1b[42m", 'Online', '\x1b[0m');
                }
                else {
                    console.log('Krenko Bot: ', "\x1b[41m", 'Offline', '\x1b[0m');
                }
                if (swearBot.online) {
                    console.log('Swear Bot: ', "\x1b[42m", 'Online', '\x1b[0m');
                }
                else {
                    console.log('Swear Bot: ', "\x1b[41m", 'Offline', '\x1b[0m');
                }
                if (yeetBot.online) {
                    console.log('Yeet Bot: ', "\x1b[42m", 'Online', '\x1b[0m');
                }
                else {
                    console.log('Yeet Bot: ', "\x1b[41m", 'Offline', '\x1b[0m');
                }
                break;
        }
        prompt();
    });
}
sendAll('start');
potatoBot.process.once('message', function (arg) {
    if (arg !== 'start') {
        return;
    }
    potatoBot.online = true;
    if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
        prompt();
    }
});
krenkoBot.process.once('message', function (arg) {
    if (arg !== 'start') {
        return;
    }
    krenkoBot.online = true;
    if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
        prompt();
    }
});
swearBot.process.once('message', function (arg) {
    if (arg !== 'start') {
        return;
    }
    swearBot.online = true;
    if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
        prompt();
    }
});
yeetBot.process.once('message', function (arg) {
    if (arg !== 'start') {
        return;
    }
    yeetBot.online = true;
    if (potatoBot.online && krenkoBot.online && swearBot.online && yeetBot.online) {
        prompt();
    }
});
//# sourceMappingURL=app.js.map