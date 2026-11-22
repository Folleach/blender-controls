import { defineDomArea } from '@blender-controls/ui';
import { code, h } from '../dom.ts';

export const elementsArea = defineDomArea(
	'blen.demo.elements',
	() => {
		const value = h('p', { class: 'muted' }, 'Drag a field, click its arrows, or click the value to type.');
		const report = (event: Event) => {
			const field = event.currentTarget as HTMLElement & { value: number };
			value.textContent = `${field.getAttribute('label') || 'value'}: ${field.value} (${event.type})`;
		};
		const field = (attributes: Record<string, string>) =>
			h('blen-number-field', { ...attributes, oninput: report, onchange: report });

		const element = h(
			'div',
			{ class: 'centered' },
			h('h1', {}, 'UI Elements'),
			h('h3', {}, 'Buttons'),
			h(
				'div',
				{ class: 'row' },
				h('blen-button', {}, 'Button'),
				h('blen-group', {}, h('blen-button', {}, 'Left'), h('blen-button', {}, 'Middle'), h('blen-button', {}, 'Right')),
				h('blen-button', { disabled: true }, 'Disabled'),
			),
			code(`<blen-group>
	<blen-button>Left</blen-button>
	<blen-button>Right</blen-button>
</blen-group>`),
			h('h3', {}, 'Number fields'),
			h(
				'div',
				{ class: 'row' },
				field({ value: '1', unit: 'm' }),
				field({ value: '0.5', step: '0.01', min: '0', max: '1', label: 'Factor' }),
				h(
					'blen-group',
					{ orientation: 'vertical' },
					field({ value: '0', label: 'X', unit: 'px' }),
					field({ value: '0', label: 'Y', unit: 'px' }),
					field({ value: '0', label: 'Z', unit: 'px' }),
				),
			),
			value,
			h('h3', {}, 'List'),
			h(
				'blen-list',
				{ header: 'Actions', style: 'width: 16rem; text-align: left' },
				h('blen-list-item', { hint: 'Ctrl D' }, 'Duplicate'),
				h('blen-list-item', { hint: 'X' }, 'Delete'),
			),
		);
		return { element };
	},
	{ name: 'UI Elements' },
);
