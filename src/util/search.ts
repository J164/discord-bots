export function search(items: string[], filter: string): Array<{ item: string; score: number; index: number }> {
	const cleanItems = items.map((item) => {
		return item.trim().toLowerCase();
	});

	const cleanFilter = filter.trim().toLowerCase();

	return cleanItems
		.map((item, index) => {
			if (item === filter) {
				return { item, score: Number.MAX_VALUE, index };
			}

			let score = 0;

			for (let f = 0; f < cleanFilter.length; f++) {
				let matchLength = 0;
				let currentMatchLength = 0;
				let filterIndex = f;
				let itemIndex = -1;
				let bestItemIndex = -1;

				// eslint-disable-next-line unicorn/no-for-loop
				for (let i = 0; i < item.length; i++) {
					if (item[i] === cleanFilter[filterIndex] && filterIndex < cleanFilter.length) {
						if (currentMatchLength === 0) {
							itemIndex = i;
						}

						currentMatchLength++;
						filterIndex++;
					} else if (currentMatchLength > 0) {
						if (matchLength < currentMatchLength) {
							matchLength = currentMatchLength;
							bestItemIndex = itemIndex;
						}

						currentMatchLength = 0;
						filterIndex = f;
					}
				}

				if (matchLength < currentMatchLength || (matchLength === currentMatchLength && bestItemIndex !== 0)) {
					matchLength = currentMatchLength;
					bestItemIndex = itemIndex;
				}

				score += calculateScore(bestItemIndex, matchLength, item.length);
				f += matchLength > 0 ? matchLength : 0;
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

function calculateScore(itemIndex: number, matchLength: number, itemLength: number): number {
	return ((itemIndex === 0 ? 2 : 0) + (itemIndex + matchLength === itemLength ? 1 : 0) + matchLength) * matchLength;
}
