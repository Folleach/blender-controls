import { Lifetime, Menu, MenuItem, MenuSeparator, leafTree, throwLater } from '@blender-controls/core';
import type { AreaTree, ContextMenu, WorkspaceCollection, WorkspaceTab } from '@blender-controls/core';
import { createDomRuntime } from '../areas.ts';
import type { DomAreaRegistry, DomAreaRuntime } from '../areas.ts';
import { TabListElement } from '../controls/tab-list.ts';
import type { TabEventDetail, TabRenameDetail } from '../controls/tab-list.ts';
import { css, html, query, shadow } from '../style.ts';
import { WorkspaceElement } from '../workspace/workspace.ts';
import type { WorkspaceViewOptions } from '../workspace/workspace.ts';

const styles = css`
:host {
	display: grid;
	grid-template-rows: auto 1fr;
	min-height: 0;
}

.views {
	position: relative;
	min-height: 0;
}

::slotted(*) {
	position: absolute;
	inset: 0;
}

::slotted([hidden]) {
	display: none;
}

:host([hidden]) {
	display: none;
}
`;

const markup = html`
<div class="tabs"></div>
<div class="views"><slot></slot></div>
`;

export interface WorkspacesViewOptions extends WorkspaceViewOptions {
	newWorkspace?: () => AreaTree;
	eager?: boolean;
	retain?: (tab: WorkspaceTab, recent: readonly WorkspaceTab[]) => boolean;
}

interface View {
	readonly element: WorkspaceElement;
	readonly runtime: DomAreaRuntime;
}

export class WorkspacesElement extends HTMLElement {
	private readonly tabs: TabListElement;
	private readonly views: Map<WorkspaceTab, View> = new Map();
	private recent: WorkspaceTab[] = [];
	private collection: WorkspaceCollection | undefined;
	private registry: DomAreaRegistry | undefined;
	private options: WorkspacesViewOptions = {};
	private connection: Lifetime | undefined;

	constructor() {
		super();
		const root = shadow(this, styles, markup);
		this.tabs = new TabListElement();
		this.tabs.setAttribute('part', 'tabs');
		this.tabs.toggleAttribute('appendable', true);
		query(root, '.tabs').replaceWith(this.tabs);

		this.tabs.addEventListener('blen-tab-select', event => {
			this.collection?.activate((event as CustomEvent<TabEventDetail>).detail.id);
		});
		this.tabs.addEventListener('blen-tab-rename', event => {
			const { id, text } = (event as CustomEvent<TabRenameDetail>).detail;
			this.collection?.rename(id, text);
		});
		this.tabs.addEventListener('blen-tab-append', () => this.addWorkspace());
		this.tabs.addEventListener('blen-tab-menu', event => this.tabMenu((event as CustomEvent<TabEventDetail>).detail));
	}

	connect(collection: WorkspaceCollection, registry: DomAreaRegistry, options: WorkspacesViewOptions = {}): void {
		this.disconnect();
		this.collection = collection;
		this.registry = registry;
		this.options = options;
		this.recent = collection.active ? [collection.active] : [];
		const connection = (this.connection = new Lifetime());
		connection.add(
			collection.changes.subscribe(change => {
				if (change.kind === 'added' && options.eager) {
					this.addView(change.tab);
				} else if (change.kind === 'removed') {
					this.removeView(change.tab);
					this.recent = this.recent.filter(tab => tab !== change.tab);
				} else if (change.kind === 'activated' && change.tab) {
					const activated = change.tab;
					this.recent = [activated, ...this.recent.filter(tab => tab !== activated)];
				}
				this.sync();
			}),
		);
		if (options.eager) {
			for (const tab of collection.tabs)
				this.addView(tab);
		}
		this.sync();
	}

	disconnect(): void {
		this.connection?.dispose();
		this.connection = undefined;
		for (const tab of [...this.views.keys()])
			this.removeView(tab);
		this.collection = undefined;
		this.recent = [];
	}

	runtimeOf(tab: WorkspaceTab): DomAreaRuntime | undefined {
		return this.views.get(tab)?.runtime;
	}

	private addView(tab: WorkspaceTab) {
		if (this.views.has(tab) || !this.registry)
			return;
		const runtime = createDomRuntime(tab.workspace, this.registry);
		const element = new WorkspaceElement();
		element.connect(tab.workspace, runtime, this.options);
		element.hidden = tab !== this.collection?.active;
		this.views.set(tab, { element, runtime });
		this.append(element);
	}

	private removeView(tab: WorkspaceTab) {
		const view = this.views.get(tab);
		if (!view)
			return;
		this.views.delete(tab);
		view.element.disconnect();
		view.element.remove();
		view.runtime.dispose();
	}

	private sync() {
		const active = this.collection?.active;
		const retain = this.options.retain;
		if (retain) {
			for (const tab of [...this.views.keys()]) {
				if (tab !== active && !this.retains(retain, tab))
					this.removeView(tab);
			}
		}
		if (active)
			this.addView(active);
		this.render();
	}

	private retains(retain: NonNullable<WorkspacesViewOptions['retain']>, tab: WorkspaceTab): boolean {
		try {
			return retain(tab, this.recent);
		} catch (error) {
			throwLater(error, 'workspace retain policy failed');
			return true;
		}
	}

	private render() {
		const collection = this.collection;
		this.tabs.tabs = collection?.tabs.map(tab => ({ id: tab.id, text: tab.name })) ?? [];
		this.tabs.active = collection?.active?.id;
		for (const [tab, view] of this.views) {
			const hidden = tab !== collection?.active;
			if (view.element.hidden !== hidden) {
				view.element.hidden = hidden;
				if (!hidden)
					view.element.measure();
			}
		}
	}

	private addWorkspace() {
		const collection = this.collection;
		if (!collection)
			return;
		const tree = this.options.newWorkspace?.() ?? leafTree(defaultType(this.registry));
		collection.add(`Workspace ${collection.tabs.length + 1}`, tree, { activate: true });
	}

	private tabMenu(detail: TabEventDetail) {
		const collection = this.collection;
		const contextMenu: ContextMenu | undefined = this.options.contextMenu;
		const tab = collection?.find(detail.id);
		if (!collection || !contextMenu || !tab)
			return;
		const index = collection.tabs.indexOf(tab);
		const menu = new Menu([
			new MenuItem('Rename', () => this.tabs.rename(tab.id), { hint: 'Double Click' }),
			new MenuItem('Duplicate', () => collection.duplicate(tab.id), { icon: 'duplicate' }),
			new MenuItem('Move Left', () => collection.move(tab.id, index - 1), { disabled: index === 0 }),
			new MenuItem('Move Right', () => collection.move(tab.id, index + 1), {
				disabled: index === collection.tabs.length - 1,
			}),
			new MenuSeparator(),
			new MenuItem('Delete', () => collection.remove(tab.id)),
		]);
		contextMenu.open(menu, { x: detail.x, y: detail.y }, tab);
	}
}

function defaultType(registry: DomAreaRegistry | undefined): string {
	const visible = registry?.list().find(info => !info.hidden);
	return visible?.type ?? 'blen.area-picker';
}

