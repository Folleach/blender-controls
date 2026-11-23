import { beforeAll, describe, expect, it } from 'vitest';
import {
	AreaRegistry,
	ContextMenu,
	LeafArea,
	Orientation,
	Side,
	SplitArea,
	Workspace,
} from '@blender-controls/core';
import {
	AreaFrameElement,
	WorkspaceElement,
	createDomRuntime,
	defaultSeparatorMenu,
	defineDomArea,
	defineElements,
} from '../src/index.ts';
import type { DomAreaInstance } from '../src/index.ts';

beforeAll(() => defineElements());

let counter = 0;
const leaf = (type = 'counter') => new LeafArea(`leaf-${++counter}`, { type, data: undefined });

function counterArea() {
	return defineDomArea('counter', () => {
		const element = document.createElement('div');
		element.className = 'counter';
		let clicks = 0;
		element.addEventListener('click', () => (element.textContent = String(++clicks)));
		return { element };
	});
}

function mount(root: LeafArea | SplitArea) {
	const registry = new AreaRegistry<DomAreaInstance>().register(counterArea());
	const workspace = new Workspace(root);
	const runtime = createDomRuntime(workspace, registry);
	const view = new WorkspaceElement();
	document.body.append(view);
	view.connect(workspace, runtime, { contextMenu: new ContextMenu() });
	return { registry, workspace, runtime, view };
}

const frames = (view: WorkspaceElement) => [...view.querySelectorAll<AreaFrameElement>(':scope > *')];

describe('<blen-workspace>', () => {
	it('renders a frame with the area element for every leaf', () => {
		const { view, workspace } = mount(new SplitArea(Orientation.Horizontal, leaf(), leaf()));

		expect(frames(view)).toHaveLength(2);
		expect(frames(view).every(frame => frame instanceof AreaFrameElement)).toBe(true);
		expect(view.shadowRoot!.querySelectorAll('.slot')).toHaveLength(workspace.leaves().length);
	});

	it('keeps the very same area element and its state through split and remove', () => {
		const a = leaf();
		const b = leaf();
		const { view, workspace, runtime } = mount(new SplitArea(Orientation.Horizontal, a, b));
		const element = runtime.get(a)!.element;
		element.click();
		element.click();

		workspace.split(a, leaf(), { orientation: Orientation.Vertical });
		workspace.remove(b);

		expect(runtime.get(a)!.element).toBe(element);
		expect(element.textContent).toBe('2');
		expect(element.isConnected).toBe(true);
		expect(frames(view)).toHaveLength(2);
	});

	it('keeps the area element when it is moved next to another leaf', () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const { view, workspace, runtime } = mount(
			new SplitArea(Orientation.Horizontal, a, new SplitArea(Orientation.Vertical, b, c)),
		);
		const element = runtime.get(a)!.element;
		const frame = element.parentElement;

		workspace.move(a, c, { side: Side.Left });

		expect(element.parentElement).toBe(frame);
		expect(frames(view)).toContain(frame);
	});

	it('re-renders the layout grid after structural changes', () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const { view, workspace } = mount(new SplitArea(Orientation.Horizontal, a, new SplitArea(Orientation.Vertical, b, c)));

		workspace.remove(c);

		const slots = [...view.shadowRoot!.querySelectorAll<HTMLElement>('.slot')].map(s => s.dataset.leaf);
		expect(slots).toEqual([a.id, b.id]);
		expect(view.shadowRoot!.querySelectorAll('.split')).toHaveLength(1);
	});

	it('applies split sizes as grid tracks', () => {
		const root = new SplitArea(Orientation.Vertical, leaf(), leaf(), 1, 3);
		const { view, workspace } = mount(root);

		workspace.setSizes(root, 2, 2);

		const grid = view.shadowRoot!.querySelector<HTMLElement>('.split')!;
		expect(grid.style.gridTemplateRows).toContain('2fr');
		expect(grid.classList.contains('vertical')).toBe(true);
	});

	it('replaces the frame when the area is replaced and removes frames of removed leaves', () => {
		const a = leaf();
		const b = leaf();
		const { view, workspace, runtime } = mount(new SplitArea(Orientation.Horizontal, a, b));
		const before = runtime.get(a)!.element;

		workspace.replace(a, { type: 'missing', data: undefined });
		workspace.remove(b);

		expect(before.isConnected).toBe(false);
		expect(runtime.get(a)!.element.textContent).toContain('Area Not Found');
		expect(frames(view)).toHaveLength(1);
	});

	it('detaches from the model without disposing it', () => {
		const a = leaf();
		const { view, runtime } = mount(a);
		const element = runtime.get(a)!.element;

		view.disconnect();

		expect(frames(view)).toHaveLength(0);
		expect(runtime.get(a)!.element).toBe(element);
	});

	it('offers swap and close in the default separator menu', () => {
		const a = leaf();
		const b = leaf();
		const root = new SplitArea(Orientation.Horizontal, a, b);
		const workspace = new Workspace(root);

		const items = defaultSeparatorMenu(root, workspace).elements(undefined) as { text: string }[];

		expect(items.map(item => item.text)).toEqual(['Swap Areas', 'Close Left Area', 'Close Right Area']);
	});
});
