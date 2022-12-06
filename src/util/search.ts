/**
 * Compares items to the filter and returns an array sorted from closest to filter to furthest
 * @param items Items to search
 * @param filter Filter to search by
 * @returns An array of the items from most similar to the filter to least
 */
export function search(items: string[], filter: string): Array<{ item: string; score: number; index: number }> {
	const cleanFilter = filter.trim().toLowerCase();

	return items
		.map((item, index) => {
			const cleanItem = item.trim().toLowerCase();

			if (cleanItem === cleanFilter) {
				return { item: cleanItem, score: Number.MAX_VALUE, index };
			}

			let score = 0;
			for (let f = 0; f < cleanFilter.length; f++) {
				let filterIndex = f;
				let bestMatchLength = 0;
				let currentMatchLength = 0;
				let currentItemIndex = -1;
				let bestItemIndex = -1;

				// eslint-disable-next-line unicorn/no-for-loop
				for (let i = 0; i < cleanItem.length; i++) {
					if (cleanItem[i] === cleanFilter[filterIndex] && filterIndex < cleanFilter.length) {
						if (currentMatchLength === 0) {
							currentItemIndex = i;
						}

						currentMatchLength++;
						filterIndex++;
					} else if (currentMatchLength > 0) {
						if (bestMatchLength < currentMatchLength) {
							bestMatchLength = currentMatchLength;
							bestItemIndex = currentItemIndex;
						}

						currentMatchLength = 0;
						filterIndex = f;
					}
				}

				if (bestMatchLength < currentMatchLength || (bestMatchLength === currentMatchLength && bestItemIndex !== 0)) {
					bestMatchLength = currentMatchLength;
					bestItemIndex = currentItemIndex;
				}

				score += ((bestItemIndex === 0 ? 2 : 0) + (bestItemIndex + bestMatchLength === cleanItem.length ? 1 : 0) + bestMatchLength) * bestMatchLength;
				f += bestMatchLength > 0 ? bestMatchLength - 1 : 0;
			}

			return {
				item,
				score,
				index,
			};
		})
		.sort((a, b) => {
			return b.score - a.score;
		});
}
