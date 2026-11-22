import type { AreaDefinition } from '@blender-controls/core';
import { defineDomArea } from './areas.ts';
import type { DomAreaInstance } from './areas.ts';
import { css, element, html, query, shadow } from './style.ts';
import { vars } from './vars.ts';

const styles = css`
:host {
	display: block;
	padding: 0.35rem 0.5rem;
	color: ${vars.text};
}

h3 {
	margin: 0 0 0.25rem;
	font-size: 1em;
}

hr {
	border: 0;
	border-top: 1px solid ${vars.border};
	margin: 0.25rem 0;
}

button {
	display: block;
	width: 100%;
	padding: 0.1rem 0.25rem 0.1rem 1.25rem;
	border: none;
	border-radius: ${vars.radiusSmall};
	font: inherit;
	text-align: left;
	color: inherit;
	background: none;
	cursor: default;
}

button:hover,
button:focus-visible {
	background: ${vars.hover};
	outline: none;
}
`;

export const AREA_PICKER_TYPE = 'blen.area-picker';

// An area listing every registered (non-hidden) area type; choosing one
// replaces the picker with it. Updates when areas are registered later.
export function areaPickerArea(options: { type?: string; name?: string } = {}): AreaDefinition<DomAreaInstance> {
	const type = options.type ?? AREA_PICKER_TYPE;
	return defineDomArea(
		type,
		context => {
			const host = element('div');
			host.style.height = '100%';
			const root = shadow(host, styles, html`<h3>Available Areas</h3><hr /><div class="items"></div>`);
			const items = query(root, '.items');

			const render = () => {
				const entries = context.catalog.list().filter(info => !info.hidden && info.type !== type);
				items.replaceChildren(
					...entries.map(info => {
						const button = element('button', undefined, info.name);
						button.addEventListener('click', () => {
							const descriptor = context.catalog.descriptor(info.type);
							if (descriptor)
								context.commands.replace(descriptor);
						});
						return button;
					}),
				);
			};
			render();
			context.lifetime.add(context.catalog.changes.subscribe(render));
			return { element: host };
		},
		{ name: options.name ?? 'Area Picker' },
	);
}
