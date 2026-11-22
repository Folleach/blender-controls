let counter = 0;

export function createId(): string {
	counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
	const random = Math.floor(Math.random() * 0x100000000).toString(36);
	return `${Date.now().toString(36)}-${counter.toString(36)}-${random}`;
}
