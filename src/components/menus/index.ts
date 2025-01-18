import type { IMenu, MenuDirectoryElement, MenuLeaf } from "@/libraries/menus";
import type { MenuService } from "@/libraries/menus/service";

export interface IMenuSpaceProps {
	service: MenuService;
}

export interface IMenuContainerProps {
	menu: IMenu;
	depth: number;
}

export interface IMenuItemProps {
	item: MenuLeaf;
}

export interface IMenuDirectoryProps {
	directory: MenuDirectoryElement;
	depth: number;
}

export const MENU_SPACE_OVERLAY_KEY = "blender-menu-space-overlay";

export interface IMenuSpaceInternal {
	service: MenuService;
}
