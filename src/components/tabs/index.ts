export interface ITab {
	text: string;
	active: boolean;
	execute: () => void;
}

export interface ITabListProps {
	tabs: ITab[];
	append?: () => void | undefined;
}
