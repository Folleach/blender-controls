import type { JSX } from "vue/jsx-runtime";
import type { ICommand } from "../commands/commands";

export interface IMenu {
	elements: () => IMenuElement[];
}

export interface IMenuElement {}

export interface IInteractableMenuItem extends IMenuElement {
	text: string;
}

export class MenuLeaf implements IInteractableMenuItem {
	text: string;
	command: ICommand;
	icon?: JSX.Element | undefined;

	constructor(text: string, command: ICommand, icon?: JSX.Element) {
		this.text = text;
		this.icon = icon;
		this.command = command;
	}
}

export class MenuSeparatorElement implements IMenuElement {}

export class MenuDirectoryElement implements IMenuElement {
	text: string;
	menu: IMenu;

	constructor(text: string, menu: IMenu) {
		this.text = text;
		this.menu = menu;
	}
}

export class Menu implements IMenu {
	private items: IMenuElement[];

	constructor(items: IMenuElement[]) {
		this.items = items;
	}

	elements() {
		return this.items;
	}
}
