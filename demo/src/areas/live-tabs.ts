import type { WorkspaceCollection } from '@blender-controls/core';
import { defineDomArea } from '@blender-controls/ui';
import type { WorkspacesElement } from '@blender-controls/ui';
import { h } from '../dom.ts';

export const LIVE_TABS = 'blen.demo.live-tabs';

export const liveTabsArea = (collection: WorkspaceCollection, app: WorkspacesElement) => {
	const seen = new WeakMap<object, number>();
	const wasAlive = new WeakSet<object>();

	return defineDomArea(
		LIVE_TABS,
		context => {
			const ages = new Map<HTMLElement, object>();
			const list = h('div', { class: 'live-tabs' });
			let structure = '';

			const snapshot = () =>
				collection.tabs.map(tab => {
					const runtime = app.runtimeOf(tab);
					if (runtime)
						wasAlive.add(tab);
					const status =
						tab === collection.active
							? 'visible'
							: runtime
								? 'hidden, alive'
								: wasAlive.has(tab)
									? 'unloaded'
									: 'not created yet';
					return { tab, status, instances: [...(runtime?.instances() ?? [])] };
				});

			const rebuild = (tabs: ReturnType<typeof snapshot>) => {
				ages.clear();
				list.replaceChildren(
					...tabs.map(({ tab, status, instances }) =>
						h(
							'section',
							{ class: 'live-tab' },
							h(
								'header',
								{},
								h('b', {}, tab.name),
								h('span', { class: status === 'visible' ? 'badge active' : 'badge' }, status),
								h('span', { class: 'muted' }, `${instances.length} area(s) alive`),
								status === 'visible' ? null : h('blen-button', { onclick: () => collection.activate(tab.id) }, 'Open'),
							),
							h(
								'ul',
								{},
								...instances.map(({ leaf, instance }) => {
									const age = h('span', { class: 'muted' });
									ages.set(age, instance);
									return h(
										'li',
										{},
										h('code', {}, leaf.descriptor.type),
										h('span', { class: 'muted' }, ` #${leaf.id.slice(-6)}`),
										leaf === context.leaf ? h('span', { class: 'badge' }, 'this area') : null,
										age,
									);
								}),
							),
						),
					),
				);
			};

			const update = () => {
				const tabs = snapshot();
				const now = Date.now();
				for (const { instances } of tabs) {
					for (const { instance } of instances) {
						if (!seen.has(instance))
							seen.set(instance, now);
					}
				}
				const next = tabs
					.map(({ tab, status, instances }) => `${tab.id}:${tab.name}:${status}:${instances.map(i => i.leaf.id).join(',')}`)
					.join('|');
				if (next !== structure) {
					structure = next;
					rebuild(tabs);
				}
				for (const [element, instance] of ages)
					element.textContent = ` · alive ${Math.round((now - seen.get(instance)!) / 1000)}s`;
			};

			update();
			queueMicrotask(update);
			const timer = setInterval(update, 1000);
			context.lifetime.add(() => clearInterval(timer));
			context.lifetime.add(collection.changes.subscribe(update));

			return {
				element: h(
					'div',
					{ class: 'padded' },
					h('h2', {}, 'Live tabs'),
					h(
						'p',
						{ class: 'muted' },
						'A tab comes alive when it is opened for the first time. Hidden tabs keep running, ' +
							'but this demo keeps only the 3 most recent ones alive (the retain option): ' +
							'open a fourth and the oldest is unloaded, then recreated from its data when reopened.',
					),
					list,
				),
			};
		},
		{ name: '[Demo] Live Tabs' },
	);
};
