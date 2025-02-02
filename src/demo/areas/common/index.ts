import type { IContext } from "@/libraries/contexts";

export interface ICodeContext extends IContext {
	code: string;
}

export interface IPlaceholderContext extends IContext {
	title: string;
	subtitle?: string | undefined;
}
