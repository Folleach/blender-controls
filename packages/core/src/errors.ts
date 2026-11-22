const host = globalThis as unknown as {
	queueMicrotask(callback: () => void): void;
};

export function throwLater(error: unknown, context?: string): void {
	const reported = context === undefined ? error : new Error(context, { cause: error });
	host.queueMicrotask(() => {
		throw reported;
	});
}
