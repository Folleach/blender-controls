import type { ICommand } from "@/libraries/commands/commands";
import type { IContext } from "@/libraries/contexts";

export interface IListItemProps {
	text: string;
	command: ICommand;
	context: IContext;
}

export interface IListContainerProps {
	header: string;
}
