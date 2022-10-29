import { Buffer } from 'node:buffer';
import sharp from 'sharp';

/**
 * Merges a number of images into one image
 * @param imageUrls Array of remote image paths
 * @param width Number of images to fit in each row
 * @returns A Promise that resolves to the merged image as a png buffer
 */
export async function mergeImages(imageUrls: string[], width: number): Promise<Buffer> {
	const rawImages = await Promise.all(
		imageUrls.map(async (url) => {
			const response = await fetch(url);
			if (!response.ok) {
				const image = sharp();

				return {
					image: await image.toBuffer(),
					metadata: await image.metadata(),
				};
			}

			const image = Buffer.from(await response.arrayBuffer());

			return {
				image,
				metadata: await sharp(image).metadata(),
			};
		}),
	);

	let numberInRow = 0;
	let posX = 0;
	let posY = 0;
	let widest = 0;
	let tallest = 0;

	const images = rawImages.map(({ image, metadata }) => {
		let x = posX;
		numberInRow++;
		posX += metadata.width ?? 0;

		if (posX > widest) {
			widest = posX;
		}

		if (metadata.height && metadata.height > tallest) {
			tallest = metadata.height;
		}

		if (numberInRow > width) {
			numberInRow = 0;
			x = 0;
			posX = metadata.width ?? 0;
			posY += tallest;
			tallest = 0;
		}

		return {
			input: image,
			left: x,
			top: posY,
		};
	});

	return sharp({
		create: {
			width: widest,
			height: posY + tallest,
			background: { alpha: 0, r: 0, g: 0, b: 0 },
			channels: 3,
		},
	})
		.composite(images)
		.toFormat('png')
		.toBuffer();
}
