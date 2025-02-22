import type { ICommand } from "@/libraries/commands/commands";
import type { IContext } from "@/libraries/contexts";
import type { Orientation } from "@/libraries/workspaces";

export interface IListItemProps {
	text: string;
	command: ICommand;
	context: IContext;
}

export interface IListContainerProps {
	header: string;
}

export interface IItemsGroupProps {
	orientation: Orientation;
}
