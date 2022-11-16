import { type ChildProcess, fork } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

class BotProcess {
	private readonly _spawnFile: string;
	private _process: ChildProcess;

	public constructor(spawnFile: string) {
		this._spawnFile = spawnFile;
		this._process = fork(spawnFile);

		this._prepareProcess();
	}

	private _prepareProcess() {
		this._process.once('exit', async () => {
			await setTimeout(30_000);
			this._process = fork(this._spawnFile);
		});
	}
}

const bots = [new BotProcess('./bots/crystal.js'), new BotProcess('./bots/potato.js'), new BotProcess('./bots/swear.js'), new BotProcess('./bots/yeet.js')];
