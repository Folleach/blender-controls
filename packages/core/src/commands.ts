export interface Command<C = unknown> {
	execute(context: C): void;
}

export type CommandLike<C = unknown> = Command<C> | ((context: C) => void);

export function command<C = unknown>(execute: (context: C) => void): Command<C> {
	return { execute };
}

export function executeCommand<C>(target: CommandLike<C>, context: C): void {
	if (typeof target === 'function')
		target(context);
	else
		target.execute(context);
}
