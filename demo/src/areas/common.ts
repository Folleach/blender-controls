import { defineDomArea } from '@blender-controls/ui';
import { h } from '../dom.ts';

export const PLACEHOLDER = 'blen.demo.placeholder';
export const CODE = 'blen.demo.code';

export interface PlaceholderData {
	title: string;
	subtitle?: string;
}

export const placeholderArea = defineDomArea<PlaceholderData>(
	PLACEHOLDER,
	context =>
		({
			element: h(
				'div',
				{ class: 'centered' },
				h('h2', {}, context.data?.title ?? 'Placeholder'),
				context.data?.subtitle ? h('p', { class: 'muted' }, context.data.subtitle) : null,
			),
		}),
	{ name: '[Demo] Placeholder', defaultData: () => ({ title: 'Nothing to show here yet.' }) },
);

export interface CodeData {
	title: string;
	code: string;
}

export const codeArea = defineDomArea<CodeData>(
	CODE,
	context => ({
		element: h(
			'div',
			{ class: 'padded' },
			h('h3', {}, context.data?.title ?? 'Code'),
			h('pre', {}, h('code', {}, (context.data?.code ?? '').trim())),
		),
	}),
	{ name: '[Demo] Code', hidden: true },
);
