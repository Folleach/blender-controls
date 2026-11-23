import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
	AreaRegistry,
	ContextMenu,
	Graph,
	GraphNode,
	InMemoryWorkspaceRepository,
	Menu,
	MenuDirectory,
	MenuItem,
	MenuSeparator,
	Orientation,
	WorkspaceCollection,
	leafTree,
	splitTree,
} from '@blender-controls/core';
import {
	MenuLayerElement,
	NodeEditorElement,
	NumberFieldElement,
	TabListElement,
	WorkspacesElement,
	areaPickerArea,
	defineDomArea,
	defineElements,
} from '../src/index.ts';
import type { DomAreaInstance } from '../src/index.ts';

beforeAll(() => defineElements());

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('defineElements', () => {
	it('is idempotent and makes the elements usable from markup', () => {
		defineElements();
		document.body.innerHTML = '<blen-button>Go</blen-button>';
		expect(document.body.firstElementChild?.shadowRoot).not.toBeNull();
	});
});

describe('<blen-menu-layer>', () => {
	it('renders items, separators and directories and executes with the context', async () => {
		const layer = new MenuLayerElement();
		document.body.append(layer);
		const model = new ContextMenu();
		layer.bind(model);
		const action = vi.fn();

		model.open(
			new Menu([
				new MenuItem('Do', action, { hint: 'Ctrl D' }),
				new MenuSeparator(),
				new MenuDirectory('More', new Menu([])),
			]),
			{ x: 10, y: 10 },
			{ id: 1 },
		);
		await flush();

		const rows = [...layer.shadowRoot!.querySelectorAll<HTMLElement>('.item')];
		expect(rows.map(row => row.querySelector('.text')!.textContent)).toEqual(['Do', 'More']);
		expect(rows[0]!.querySelector('.hint')!.textContent).toBe('Ctrl D');
		expect(layer.shadowRoot!.querySelectorAll('.separator')).toHaveLength(1);
		expect(layer.hasAttribute('open')).toBe(true);

		rows[0]!.click();
		expect(action).toHaveBeenCalledWith({ id: 1 });
		expect(layer.hasAttribute('open')).toBe(false);
	});

	it('keeps the menu on presses inside it and closes on presses outside', async () => {
		const layer = new MenuLayerElement();
		document.body.append(layer);
		layer.bind(new ContextMenu());
		layer.contextMenu.open(new Menu([new MenuItem('Do', () => {})]), { x: 0, y: 0 });
		await flush();

		const row = layer.shadowRoot!.querySelector('.item')!;
		row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
		expect(layer.contextMenu.isOpen).toBe(true);

		layer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
		expect(layer.contextMenu.isOpen).toBe(false);
	});

	it('closes the level when async elements fail', async () => {
		const reported: unknown[] = [];
		const spy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(callback => {
			try {
				callback();
			} catch (error) {
				reported.push(error);
			}
		});
		const layer = new MenuLayerElement();
		document.body.append(layer);
		layer.bind(new ContextMenu());
		const offline = new Error('offline');

		layer.contextMenu.open({ elements: () => Promise.reject(offline) }, { x: 0, y: 0 });
		await flush();
		spy.mockRestore();

		expect(layer.contextMenu.isOpen).toBe(false);
		expect((reported[0] as Error).message).toBe('failed to resolve menu elements');
		expect((reported[0] as Error).cause).toBe(offline);
	});
});

describe('<blen-number-field>', () => {
	it('normalizes the value to step, precision and bounds', () => {
		const field = new NumberFieldElement();
		field.setAttribute('step', '0.25');
		field.setAttribute('min', '0');
		field.setAttribute('max', '2');
		document.body.append(field);

		field.value = 1.3;
		expect(field.value).toBe(1.25);
		field.value = 5;
		expect(field.value).toBe(2);
		expect(field.shadowRoot!.querySelector('.value')!.textContent).toBe('2.00');
	});

	it('does not depend on the order of attributes', () => {
		document.body.innerHTML = '<blen-number-field value="0.5" step="0.01" max="1"></blen-number-field>';
		const field = document.body.firstElementChild as NumberFieldElement;
		expect(field.value).toBe(0.5);
		expect(field.shadowRoot!.querySelector('.value')!.textContent).toBe('0.50');
	});

	it('steps with the keyboard and fires change', () => {
		const field = new NumberFieldElement();
		field.setAttribute('unit', 'px');
		document.body.append(field);
		const change = vi.fn();
		field.addEventListener('change', change);

		field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

		expect(field.value).toBe(1);
		expect(change).toHaveBeenCalledTimes(1);
		expect(field.shadowRoot!.querySelector('.value')!.textContent).toBe('1 px');
	});
});

describe('<blen-tab-list>', () => {
	it('renders tabs and reports selection', () => {
		const tabs = new TabListElement();
		document.body.append(tabs);
		tabs.tabs = [
			{ id: 'a', text: 'First' },
			{ id: 'b', text: 'Second' },
		];
		tabs.active = 'b';
		const selected = vi.fn();
		tabs.addEventListener('blen-tab-select', event => selected((event as CustomEvent).detail.id));

		const views = [...tabs.shadowRoot!.querySelectorAll<HTMLElement>('.tab')];
		views[0]!.click();

		expect(views.map(v => v.textContent)).toEqual(['First', 'Second']);
		expect(views[1]!.classList.contains('active')).toBe(true);
		expect(selected).toHaveBeenCalledWith('a');
	});
});

describe('<blen-workspaces>', () => {
	it('keeps inactive workspaces alive and hidden', () => {
		const registry = new AreaRegistry<DomAreaInstance>().register(
			defineDomArea('box', () => ({ element: document.createElement('div') })),
		);
		const collection = new WorkspaceCollection({ repository: new InMemoryWorkspaceRepository() });
		const first = collection.add('First', leafTree('box'));
		const second = collection.add('Second', leafTree('box'));
		const view = new WorkspacesElement();
		document.body.append(view);
		view.connect(collection, registry);

		const element = view.runtimeOf(first)!.get(first.workspace.leaves()[0]!)!.element;
		collection.activate(second.id);

		const workspaces = [...view.children] as HTMLElement[];
		expect(workspaces).toHaveLength(2);
		expect(workspaces[0]!.hidden).toBe(true);
		expect(workspaces[1]!.hidden).toBe(false);
		expect(element.isConnected).toBe(true);

		collection.remove(first.id);
		expect(view.children).toHaveLength(1);
		expect(element.isConnected).toBe(false);
	});

	const counting = () => {
		const created: { data: unknown; disposed: boolean }[] = [];
		const registry = new AreaRegistry<DomAreaInstance>().register(
			defineDomArea<unknown>('box', context => {
				const record = { data: context.data, disposed: false };
				created.push(record);
				return { element: document.createElement('div'), dispose: () => (record.disposed = true) };
			}),
		);
		return { created, registry };
	};

	it('creates a workspace only when it is activated for the first time', () => {
		const { created, registry } = counting();
		const collection = new WorkspaceCollection();
		collection.add('First', leafTree('box'));
		const second = collection.add('Second', splitTree(Orientation.Horizontal, leafTree('box'), leafTree('box')));
		collection.add('Third', leafTree('box'));
		const view = new WorkspacesElement();
		document.body.append(view);

		view.connect(collection, registry);
		expect(created).toHaveLength(1);
		expect(view.runtimeOf(second)).toBeUndefined();

		collection.activate(second.id);
		expect(created).toHaveLength(3);
		expect(view.runtimeOf(second)).toBeDefined();

		collection.add('Fourth', leafTree('box'));
		expect(created).toHaveLength(3);
	});

	it('creates everything at once with eager', () => {
		const { created, registry } = counting();
		const collection = new WorkspaceCollection();
		collection.add('First', leafTree('box'));
		collection.add('Second', leafTree('box'));
		const view = new WorkspacesElement();
		document.body.append(view);

		view.connect(collection, registry, { eager: true });
		expect(created).toHaveLength(2);

		collection.add('Third', leafTree('box'));
		expect(created).toHaveLength(3);
	});

	it('unloads what retain rejects and recreates it from leaf data when reopened', () => {
		const { created, registry } = counting();
		const collection = new WorkspaceCollection();
		const first = collection.add('First', leafTree('box', { note: 'kept in data' }));
		const second = collection.add('Second', leafTree('box'));
		const third = collection.add('Third', leafTree('box'));
		const view = new WorkspacesElement();
		document.body.append(view);
		const recents: string[][] = [];
		view.connect(collection, registry, {
			retain: (tab, recent) => {
				recents.push(recent.map(t => t.name));
				return recent.indexOf(tab) < 2 && recent.includes(tab);
			},
		});

		collection.activate(second.id);
		expect(view.runtimeOf(first)).toBeDefined();
		collection.activate(third.id);

		expect(view.runtimeOf(first)).toBeUndefined();
		expect(view.runtimeOf(second)).toBeDefined();
		expect(created[0]!.disposed).toBe(true);
		expect(recents.at(-1)).toEqual(['Third', 'Second', 'First']);
		expect(view.children).toHaveLength(2);

		collection.activate(first.id);
		const recreated = created.at(-1)!;
		expect(recreated).not.toBe(created[0]);
		expect(recreated.data).toEqual({ note: 'kept in data' });
		expect(view.runtimeOf(third)).toBeDefined();
		expect(view.runtimeOf(second)).toBeUndefined();
	});

	it('keeps the workspace when the retain policy throws', () => {
		const reported: unknown[] = [];
		const spy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(callback => {
			try {
				callback();
			} catch (error) {
				reported.push(error);
			}
		});
		const { registry } = counting();
		const collection = new WorkspaceCollection();
		const first = collection.add('First', leafTree('box'));
		const second = collection.add('Second', leafTree('box'));
		const view = new WorkspacesElement();
		document.body.append(view);
		view.connect(collection, registry, {
			retain: () => {
				throw new Error('bad policy');
			},
		});

		collection.activate(second.id);
		spy.mockRestore();

		expect(view.runtimeOf(first)).toBeDefined();
		expect((reported[0] as Error).message).toBe('workspace retain policy failed');
	});
});

describe('area picker', () => {
	it('lists registered areas and replaces itself with the chosen one', () => {
		const registry = new AreaRegistry<DomAreaInstance>()
			.register(areaPickerArea())
			.register(defineDomArea('box', () => ({ element: document.createElement('section') }), { name: 'Box' }));
		const collection = new WorkspaceCollection();
		const tab = collection.add('Main', leafTree('blen.area-picker'));
		const view = new WorkspacesElement();
		document.body.append(view);
		view.connect(collection, registry);
		const leaf = tab.workspace.leaves()[0]!;
		const picker = view.runtimeOf(tab)!.get(leaf)!.element;

		const buttons = [...picker.shadowRoot!.querySelectorAll('button')];
		expect(buttons.map(b => b.textContent)).toEqual(['Box']);
		buttons[0]!.click();

		expect(leaf.descriptor.type).toBe('box');
		expect(view.runtimeOf(tab)!.get(leaf)!.element.tagName).toBe('SECTION');
	});
});

describe('<blen-node-editor>', () => {
	it('renders nodes, sockets, slotted content and relations', () => {
		const graph = new Graph();
		const a = new GraphNode({ x: 0, y: 0 }, 'Source');
		const out = a.addOutput('value', 'number');
		const b = new GraphNode({ x: 200, y: 0 }, 'Target');
		const input = b.addInput('value', 'number');
		graph.add(a);
		graph.add(b);
		const editor = new NodeEditorElement();
		document.body.append(editor);
		editor.bind(graph, {
			renderContent: node => {
				const content = document.createElement('p');
				content.textContent = `content of ${node.title}`;
				return content;
			},
		});

		graph.link(out, input);

		const root = editor.shadowRoot!;
		expect([...root.querySelectorAll('.title')].map(t => t.textContent)).toEqual(['Source', 'Target']);
		expect(root.querySelectorAll('.socket')).toHaveLength(2);
		expect(root.querySelectorAll('.links path')).toHaveLength(1);
		expect(editor.querySelectorAll('p')).toHaveLength(2);

		graph.remove(a);
		expect(root.querySelectorAll('.node')).toHaveLength(1);
		expect(root.querySelectorAll('.links path')).toHaveLength(0);
		expect(editor.querySelectorAll('p')).toHaveLength(1);
	});

	it('translates client positions into graph coordinates using the pan offset', () => {
		const editor = new NodeEditorElement();
		document.body.append(editor);
		editor.offset = { x: 100, y: 50 };

		const box = editor.shadowRoot!.querySelector('.space')!.getBoundingClientRect();
		expect(editor.toGraph({ x: box.left + 130, y: box.top + 60 })).toEqual({ x: 30, y: 10 });
	});

	it('zooms around the given client position', () => {
		const editor = new NodeEditorElement();
		document.body.append(editor);
		editor.offset = { x: 100, y: 50 };

		const box = editor.shadowRoot!.querySelector('.space')!.getBoundingClientRect();
		const client = { x: box.left + 140, y: box.top + 70 };
		const before = editor.toGraph(client);
		editor.zoomAt(2, client);

		expect(editor.zoom).toBe(2);
		expect(editor.toGraph(client)).toEqual(before);
		expect(editor.toGraph({ x: box.left + 100, y: box.top + 50 })).toEqual({ x: 20, y: 10 });

		editor.zoom = 100;
		expect(editor.zoom).toBe(8);
	});

	describe('wheel', () => {
		const wheel = (editor: NodeEditorElement, init: WheelEventInit) => {
			const space = editor.shadowRoot!.querySelector('.space')!;
			const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
			// happy-dom ignores modifier keys of WheelEventInit
			Object.defineProperty(event, 'ctrlKey', { value: init.ctrlKey ?? false });
			space.dispatchEvent(event);
			return event;
		};

		const create = () => {
			const editor = new NodeEditorElement();
			document.body.append(editor);
			editor.offset = { x: 100, y: 50 };
			return editor;
		};

		it('pans on a two finger trackpad scroll', () => {
			const editor = create();
			const event = wheel(editor, { deltaX: 3.5, deltaY: -7.25 });

			expect(event.defaultPrevented).toBe(true);
			expect(editor.zoom).toBe(1);
			expect(editor.offset).toEqual({ x: 96.5, y: 57.25 });
		});

		it('zooms on a trackpad pinch', () => {
			const editor = create();
			wheel(editor, { deltaY: -10, ctrlKey: true });

			expect(editor.zoom).toBeGreaterThan(1);
		});

		it('zooms on a mouse wheel notch', () => {
			const editor = create();
			wheel(editor, { deltaY: 100 });

			expect(editor.zoom).toBeLessThan(1);
		});

		it('zooms on a line based mouse wheel', () => {
			const editor = create();
			wheel(editor, { deltaY: -3, deltaMode: WheelEvent.DOM_DELTA_LINE });

			expect(editor.zoom).toBeGreaterThan(1);
		});
	});
});
