export interface ICommand {
	execute: () => void;
}

export interface ICommandRegistrar {
	register: (id: string, command: ICommand) => void;
}

export class CommonRegistrar implements ICommandRegistrar {
	private source: string;

	constructor(source: string) {
		this.source = source;
	}

	register(id: string, command: ICommand) {}
}

export class CommandService {
	private commands = new Map<string, ICommand>();

	register(source: string, id: string, comamnd: ICommand) {
		this.commands.set(`${source}.${id}`, comamnd);
	}
}
