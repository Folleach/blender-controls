export interface IPipe<T> {
	consume: (action: (value: T) => void) => void;
	push: (value: T) => void;
}

export class LastPipe<T> implements IPipe<T> {
	last: T | undefined;
	waiter: ((value: T) => void) | undefined;

	consume(action: (value: T) => void): void {
		this.waiter = action;
		if (this.last) action(this.last);
	}

	push(value: T): void {
		if (this.waiter) this.waiter(value);

		this.last = value;
	}
}

export class BroadcastPipe<T> implements IPipe<T> {
	private subscribers: ((value: T) => void)[] = [];
	private last: T | undefined = undefined;

	consume(action: (value: T) => void) {
		if (this.subscribers.length > 2) console.error("potential leak in the pipes");
		this.subscribers.push(action);
		if (this.last) action(this.last);
	}

	push(value: T): void {
		for (const subscriber of this.subscribers) subscriber(value);
		this.last = value;
	}
}
