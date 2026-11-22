import { throwLater } from '../errors.ts';
import { Bus } from '../events.ts';
import type { Disposable } from '../events.ts';
import { createId } from '../identifier.ts';
import { Area } from '../layout/area.ts';
import { fromTree, toTree } from '../layout/tree.ts';
import type { AreaTree } from '../layout/tree.ts';
import { Workspace } from '../layout/workspace.ts';
import type { WorkspaceCollectionState, WorkspaceRepository } from './repository.ts';

const timers = globalThis as unknown as {
	setTimeout(callback: () => void, ms: number): unknown;
	clearTimeout(handle: unknown): void;
};

export class WorkspaceTab {
	constructor(
		readonly id: string,
		public name: string,
		readonly workspace: Workspace,
	) {}
}

export type WorkspaceCollectionChange =
	| { readonly kind: 'added'; readonly tab: WorkspaceTab }
	| { readonly kind: 'removed'; readonly tab: WorkspaceTab }
	| { readonly kind: 'renamed'; readonly tab: WorkspaceTab }
	| { readonly kind: 'reordered' }
	| { readonly kind: 'activated'; readonly tab: WorkspaceTab | undefined };

export interface WorkspaceCollectionOptions {
	repository?: WorkspaceRepository;
	autosaveDelay?: number;
}

export class WorkspaceCollection {
	readonly changes: Bus<WorkspaceCollectionChange> = new Bus();

	private readonly _tabs: WorkspaceTab[] = [];
	private readonly subscriptions: Map<WorkspaceTab, Disposable> = new Map();
	private readonly repository: WorkspaceRepository | undefined;
	private readonly autosaveDelay: number;
	private _active: WorkspaceTab | undefined;
	private saveTimer: unknown;
	private saving: Promise<void> = Promise.resolve();

	constructor(options: WorkspaceCollectionOptions = {}) {
		this.repository = options.repository;
		this.autosaveDelay = options.autosaveDelay ?? 300;
	}

	get tabs(): readonly WorkspaceTab[] {
		return this._tabs;
	}

	get active(): WorkspaceTab | undefined {
		return this._active;
	}

	find(id: string): WorkspaceTab | undefined {
		return this._tabs.find(tab => tab.id === id);
	}

	async restore(): Promise<boolean> {
		const state = await this.repository?.load();
		if (!state || !Array.isArray(state.items))
			return false;
		let restored = 0;
		for (const record of state.items) {
			try {
				this.attach(new WorkspaceTab(record.id, record.name, new Workspace(fromTree(record.tree))));
				restored++;
			} catch (error) {
				throwLater(error, `failed to restore workspace '${record?.name}'`);
			}
		}
		if (restored === 0)
			return false;
		this.activate(state.active && this.find(state.active) ? state.active : this._tabs[0]!.id);
		return true;
	}

	add(name: string, root: Area | AreaTree, options: { id?: string; activate?: boolean } = {}): WorkspaceTab {
		const id = options.id ?? createId();
		if (this.find(id))
			throw new Error(`workspace '${id}' already exists`);
		const area = root instanceof Area ? root : fromTree(root);
		const tab = this.attach(new WorkspaceTab(id, name, new Workspace(area)));
		if (options.activate || !this._active)
			this.activate(id);
		return tab;
	}

	remove(id: string): boolean {
		const index = this._tabs.findIndex(tab => tab.id === id);
		if (index < 0)
			return false;
		const [tab] = this._tabs.splice(index, 1);
		this.subscriptions.get(tab!)?.();
		this.subscriptions.delete(tab!);
		this.changed({ kind: 'removed', tab: tab! });
		if (this._active === tab)
			this.activate((this._tabs[index] ?? this._tabs[index - 1])?.id);
		return true;
	}

	rename(id: string, name: string): void {
		const tab = this.find(id);
		if (!tab || tab.name === name)
			return;
		tab.name = name;
		this.changed({ kind: 'renamed', tab });
	}

	activate(id: string | undefined): void {
		const tab = id === undefined ? undefined : this.find(id);
		if (tab === this._active)
			return;
		this._active = tab;
		this.changed({ kind: 'activated', tab });
	}

	duplicate(id: string, name?: string): WorkspaceTab | undefined {
		const source = this.find(id);
		if (!source)
			return undefined;
		const workspace = new Workspace(fromTree(toTree(source.workspace.root), { freshIds: true }));
		const tab = this.attach(new WorkspaceTab(createId(), name ?? `${source.name} copy`, workspace));
		this.move(tab.id, this._tabs.indexOf(source) + 1);
		return tab;
	}

	move(id: string, index: number): void {
		const from = this._tabs.findIndex(tab => tab.id === id);
		const to = Math.max(0, Math.min(index, this._tabs.length - 1));
		if (from < 0 || from === to)
			return;
		const [tab] = this._tabs.splice(from, 1);
		this._tabs.splice(to, 0, tab!);
		this.changed({ kind: 'reordered' });
	}

	snapshot(): WorkspaceCollectionState {
		return {
			active: this._active?.id,
			items: this._tabs.map(tab => ({ id: tab.id, name: tab.name, tree: toTree(tab.workspace.root) })),
		};
	}

	save(): Promise<void> {
		this.cancelScheduledSave();
		const repository = this.repository;
		if (!repository)
			return Promise.resolve();
		const state = this.snapshot();
		this.saving = this.saving
			.then(() => repository.save(state))
			.catch(error => throwLater(error, 'failed to save workspaces'));
		return this.saving;
	}

	dispose(): void {
		this.cancelScheduledSave();
		for (const unsubscribe of this.subscriptions.values())
			unsubscribe();
		this.subscriptions.clear();
	}

	private attach(tab: WorkspaceTab): WorkspaceTab {
		if (this.find(tab.id))
			throw new Error(`workspace '${tab.id}' already exists`);
		this._tabs.push(tab);
		this.subscriptions.set(tab, tab.workspace.changes.subscribe(() => this.scheduleSave()));
		this.changed({ kind: 'added', tab });
		return tab;
	}

	private changed(change: WorkspaceCollectionChange) {
		this.changes.dispatch(change);
		this.scheduleSave();
	}

	private scheduleSave() {
		if (!this.repository || this.autosaveDelay <= 0)
			return;
		this.cancelScheduledSave();
		this.saveTimer = timers.setTimeout(() => {
			this.saveTimer = undefined;
			void this.save();
		}, this.autosaveDelay);
	}

	private cancelScheduledSave() {
		if (this.saveTimer !== undefined) {
			timers.clearTimeout(this.saveTimer);
			this.saveTimer = undefined;
		}
	}
}
