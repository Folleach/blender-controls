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
