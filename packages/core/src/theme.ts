import { Bus } from './events.ts';

export type Theme = Readonly<Record<string, string>>;

export class ThemeState {
	readonly changes: Bus<Theme> = new Bus();
	private _current: Theme = {};

	get current(): Theme {
		return this._current;
	}

	set(...themes: Theme[]): void {
		this._current = Object.assign({}, ...themes);
		this.changes.dispatch(this._current);
	}
}
