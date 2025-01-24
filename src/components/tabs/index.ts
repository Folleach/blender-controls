import type { IHaveContextMenuEvent } from "@/libraries/common/events";

export interface ITab extends IHaveContextMenuEvent {
	text: string;
	active: boolean;
	execute: () => void;
}

export interface ITabListProps {
	tabs: ITab[];
	append?: () => void | undefined;
}
