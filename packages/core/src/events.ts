import { throwLater } from './errors.ts';

export type Disposable = () => void;

interface Subscription<T> {
	readonly handler: (value: T) => void;
	active: boolean;
}

export class Bus<T> {
	private subscriptions: readonly Subscription<T>[] = [];

	subscribe(handler: (value: T) => void): Disposable {
		const subscription: Subscription<T> = { handler, active: true };
		this.subscriptions = [...this.subscriptions, subscription];
		return () => {
			if (!subscription.active)
				return;
			subscription.active = false;
			this.subscriptions = this.subscriptions.filter(s => s !== subscription);
		};
	}

	dispatch(value: T): void {
		for (const subscription of this.subscriptions) {
			if (!subscription.active)
				continue;
			try {
				subscription.handler(value);
			} catch (error) {
				throwLater(error, 'bus subscriber failed');
			}
		}
	}

	get size(): number {
		return this.subscriptions.length;
	}
}

export class Lifetime {
	private callbacks: Disposable[] = [];
	private _disposed = false;

	get disposed(): boolean {
		return this._disposed;
	}

	add(callback: Disposable): void {
		if (this._disposed) {
			callback();
			return;
		}
		this.callbacks.push(callback);
	}

	dispose(): void {
		if (this._disposed)
			return;
		this._disposed = true;
		const callbacks = this.callbacks.reverse();
		this.callbacks = [];
		for (const callback of callbacks) {
			try {
				callback();
			} catch (error) {
				throwLater(error, 'lifetime cleanup failed');
			}
		}
	}
}
