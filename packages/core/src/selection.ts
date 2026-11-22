import { Bus } from './events.ts';

export class Selection<T> {
	readonly changes: Bus<void> = new Bus();
	private readonly items: Set<T> = new Set();

	has(item: T): boolean {
		return this.items.has(item);
	}

	get size(): number {
		return this.items.size;
	}

	values(): T[] {
		return [...this.items];
	}

	select(items: Iterable<T>, append = false): void {
		if (!append)
			this.items.clear();
		for (const item of items)
			this.items.add(item);
		this.changes.dispatch();
	}

	delete(item: T): void {
		if (this.items.delete(item))
			this.changes.dispatch();
	}

	clear(): void {
		if (this.items.size === 0)
			return;
		this.items.clear();
		this.changes.dispatch();
	}
}
