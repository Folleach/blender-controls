import { ButtonElement } from './controls/button.ts';
import { GroupElement } from './controls/group.ts';
import { ListItemElement } from './controls/list-item.ts';
import { ListElement } from './controls/list.ts';
import { NumberFieldElement } from './controls/number-field.ts';
import { SeparatorElement } from './controls/separator.ts';
import { TabListElement } from './controls/tab-list.ts';
import { MenuLayerElement } from './menus/menu-layer.ts';
import { NodeEditorElement } from './nodes/node-editor.ts';
import { AreaFrameElement } from './workspace/frame.ts';
import { WorkspaceElement } from './workspace/workspace.ts';
import { WorkspacesElement } from './workspaces/workspaces.ts';

const elements = {
	'blen-button': ButtonElement,
	'blen-group': GroupElement,
	'blen-list': ListElement,
	'blen-list-item': ListItemElement,
	'blen-separator': SeparatorElement,
	'blen-number-field': NumberFieldElement,
	'blen-tab-list': TabListElement,
	'blen-menu-layer': MenuLayerElement,
	'blen-node-editor': NodeEditorElement,
	'blen-area-frame': AreaFrameElement,
	'blen-workspace': WorkspaceElement,
	'blen-workspaces': WorkspacesElement,
};

export function defineElements(additional: Readonly<Record<string, CustomElementConstructor>> = {}, options: DefineElementsOptions = {}): void {
	registerElements({ ...elements, ...additional }, options);
}

export interface DefineElementsOptions {
	// empty
}

export function registerElements(table: Readonly<Record<string, CustomElementConstructor>>, options: DefineElementsOptions = {}): void {
	for (const [tag, element] of Object.entries(table)) {
		const existing = customElements.get(tag);
		if (!existing)
			customElements.define(tag, element);
		else if (existing !== element)
			throw new Error(`<${tag}> is already defined by something else`);
	}
}
