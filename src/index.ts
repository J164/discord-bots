import type { ChildProcess } from 'node:child_process';
import { fork } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { config } from 'dotenv';

config();

class BotProcess {
	private _process: ChildProcess;

	public constructor(spawnFile: string) {
		this._process = fork(spawnFile);
		this._prepareProcess();
	}

	private _prepareProcess() {
		this._process.once('exit', async () => {
			await setTimeout(30_000);
			this._process = fork(this._process.spawnfile);
		});
	}
}

const bots = [
	new BotProcess('./dist/bots/crystal.js'),
	new BotProcess('./dist/bots/potato.js'),
	new BotProcess('./dist/bots/swear.js'),
	new BotProcess('./dist/bots/yeet.js'),
];
