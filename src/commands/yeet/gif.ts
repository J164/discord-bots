import { type YeetChatCommand } from '../../types/bot-types/yeet.js';
import { EmbedType, messageOptions, responseOptions } from '../../util/builders.js';

export const command: YeetChatCommand<'Global'> = {
	data: {
		name: 'gif',
		description: 'Get a gif related to YEET',
	},
	async respond(response, globalInfo) {
		const request = await fetch(`https://g.tenor.com/v1/search?q=yeet&key=${globalInfo.tenorKey}&limit=50&contentfilter=medium`);
		if (!request.ok) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, "Couldn't find a gif"));
			return;
		}

		const gifs = (await request.json()) as TenorResponse;
		await response.interaction.editReply(
			messageOptions({
				content: gifs.results[Math.floor(Math.random() * gifs.results.length)].itemurl,
			}),
		);
	},
	type: 'Global',
};
