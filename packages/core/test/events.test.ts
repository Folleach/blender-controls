import { describe, expect, it, vi } from 'vitest';
import { Bus, Lifetime, throwLater } from '../src/index.ts';
import { captureThrown } from './helpers.ts';

describe('Bus', () => {
	it('delivers to every subscriber, not only the last one', () => {
		const bus = new Bus<number>();
		const first: number[] = [];
		const second: number[] = [];
		bus.subscribe(v => first.push(v));
		bus.subscribe(v => second.push(v));

		bus.dispatch(0);

		expect(first).toEqual([0]);
		expect(second).toEqual([0]);
	});

	it('stops delivering after dispose', () => {
		const bus = new Bus<string>();
		const received: string[] = [];
		const dispose = bus.subscribe(v => received.push(v));

		bus.dispatch('a');
		dispose();
		bus.dispatch('b');

		expect(received).toEqual(['a']);
		expect(bus.size).toBe(0);
	});

	it('disposes the same function subscribed twice independently', () => {
		const bus = new Bus<void>();
		const handler = vi.fn();
		const first = bus.subscribe(handler);
		bus.subscribe(handler);

		first();
		bus.dispatch();

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('ignores a repeated dispose instead of removing another subscription', () => {
		const bus = new Bus<void>();
		const handler = vi.fn();
		const first = bus.subscribe(handler);
		bus.subscribe(handler);

		first();
		first();
		bus.dispatch();

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('does not call subscribers added during dispatch in that dispatch', () => {
		const bus = new Bus<void>();
		const late = vi.fn();
		bus.subscribe(() => bus.subscribe(late));

		bus.dispatch();
		expect(late).not.toHaveBeenCalled();

		bus.dispatch();
		expect(late).toHaveBeenCalledTimes(1);
	});

	it('keeps delivering when a subscriber throws and reports the error later', () => {
		const thrown = captureThrown();
		const bus = new Bus<void>();
		const after = vi.fn();
		const boom = new Error('boom');
		bus.subscribe(() => {
			throw boom;
		});
		bus.subscribe(after);

		bus.dispatch();

		expect(after).toHaveBeenCalled();
		expect(thrown.errors).toHaveLength(1);
		expect((thrown.errors[0] as Error).message).toBe('bus subscriber failed');
		expect((thrown.errors[0] as Error).cause).toBe(boom);
		thrown.restore();
	});

	it('does not call a subscriber disposed earlier in the same dispatch', () => {
		const bus = new Bus<void>();
		const calls: string[] = [];
		let disposeSecond = () => {};
		bus.subscribe(() => {
			calls.push('first');
			disposeSecond();
		});
		disposeSecond = bus.subscribe(() => calls.push('second'));

		bus.dispatch();
		bus.dispatch();

		expect(calls).toEqual(['first', 'first']);
	});

	it('does not revive a disposed subscription when its handler subscribes again', () => {
		const bus = new Bus<void>();
		const calls: string[] = [];
		const second = () => calls.push('second');
		let disposeSecond = () => {};
		let resubscribed = false;
		bus.subscribe(() => {
			calls.push('first');
			if (resubscribed)
				return;
			resubscribed = true;
			disposeSecond();
			disposeSecond = bus.subscribe(second);
		});
		disposeSecond = bus.subscribe(second);

		bus.dispatch();
		expect(calls).toEqual(['first']);

		bus.dispatch();
		expect(calls).toEqual(['first', 'first', 'second']);
		expect(bus.size).toBe(2);
	});

	it('handles nested dispatches from inside a handler', () => {
		const bus = new Bus<number>();
		const calls: number[] = [];
		bus.subscribe(value => {
			calls.push(value);
			if (value < 3)
				bus.dispatch(value + 1);
		});

		bus.dispatch(1);

		expect(calls).toEqual([1, 2, 3]);
	});
});

describe('Lifetime', () => {
	it('runs cleanups in reverse order exactly once', () => {
		const lifetime = new Lifetime();
		const calls: number[] = [];
		lifetime.add(() => calls.push(1));
		lifetime.add(() => calls.push(2));

		lifetime.dispose();
		lifetime.dispose();

		expect(calls).toEqual([2, 1]);
		expect(lifetime.disposed).toBe(true);
	});

	it('runs cleanups added after dispose immediately', () => {
		const lifetime = new Lifetime();
		lifetime.dispose();
		const cleanup = vi.fn();

		lifetime.add(cleanup);

		expect(cleanup).toHaveBeenCalled();
	});
});

describe('throwLater', () => {
	it('throws from a microtask, not synchronously', () => {
		const queued: (() => void)[] = [];
		const spy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(callback => queued.push(callback));
		const error = new Error('later');

		expect(() => throwLater(error)).not.toThrow();
		spy.mockRestore();

		expect(queued).toHaveLength(1);
		expect(() => queued[0]!()).toThrow(error);
	});

	it('wraps the error with context, keeping the original as cause', () => {
		const thrown = captureThrown();
		const original = new Error('disk full');

		throwLater(original, 'failed to save');
		thrown.restore();

		const reported = thrown.errors[0] as Error;
		expect(reported.message).toBe('failed to save');
		expect(reported.cause).toBe(original);
	});

	it('reports non-Error values as they are', () => {
		const thrown = captureThrown();
		throwLater('just a string');
		thrown.restore();
		expect(thrown.errors).toEqual(['just a string']);
	});
});
