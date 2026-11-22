import { AreaRuntime } from '@blender-controls/core';
import type {
	AreaContext,
	AreaDefinition,
	AreaFallbackReason,
	AreaInstance,
	AreaRegistry,
	Workspace,
} from '@blender-controls/core';
import { element } from './style.ts';

export interface DomAreaInstance extends AreaInstance {
	readonly element: HTMLElement;
	attached?(): void;
	detached?(): void;
}

export type DomAreaRegistry = AreaRegistry<DomAreaInstance>;
export type DomAreaRuntime = AreaRuntime<DomAreaInstance>;

export interface DomAreaOptions<D> {
	name?: string;
	hidden?: boolean;
	defaultData?: () => D;
}

export function defineDomArea<D = undefined>(
	type: string,
	create: (context: AreaContext<D>) => DomAreaInstance,
	options: DomAreaOptions<D> = {},
): AreaDefinition<DomAreaInstance, D> {
	return { type, create, ...options };
}

export interface IframeAreaOptions<D> extends DomAreaOptions<D> {
	src: (context: AreaContext<D>) => string | URL;
	onLoad?: (frame: HTMLIFrameElement, context: AreaContext<D>) => void;
	attributes?: Readonly<Record<string, string>>;
}

export function iframeArea<D = undefined>(type: string, options: IframeAreaOptions<D>): AreaDefinition<DomAreaInstance, D> {
	const { src, onLoad, attributes, ...rest } = options;
	return defineDomArea<D>(
		type,
		context => {
			const frame = document.createElement('iframe');
			for (const [name, value] of Object.entries(attributes ?? {}))
				frame.setAttribute(name, value);
			if (onLoad) {
				const load = () => onLoad(frame, context);
				frame.addEventListener('load', load);
				context.lifetime.add(() => frame.removeEventListener('load', load));
			}
			frame.src = src(context).toString();
			return { element: frame };
		},
		rest,
	);
}

export function fallbackArea(context: AreaContext, reason: AreaFallbackReason, error?: unknown): DomAreaInstance {
	const root = element('div', 'blen-area-fallback');
	Object.assign(root.style, {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		height: '100%',
		padding: '1rem',
		boxSizing: 'border-box',
	});
	const box = element('div');
	const title = reason === 'missing' ? 'Area Not Found' : 'Area Failed';
	const details =
		reason === 'missing'
			? `“${context.leaf.descriptor.type}” will be drawn when it gets registered.`
			: `“${context.leaf.descriptor.type}” failed to start: ${error instanceof Error ? error.message : String(error)}`;
	box.append(element('h2', undefined, title), element('p', undefined, details));
	root.append(box);
	return { element: root };
}

export function createDomRuntime(workspace: Workspace, registry: DomAreaRegistry): DomAreaRuntime {
	return new AreaRuntime(workspace, registry, { fallback: fallbackArea });
}
