import type { IContext } from "../contexts";
import type { ICommand } from "./commands";

export class AdHocCommand implements ICommand {
	private f: (context: IContext) => void;

	constructor(f: (context: IContext) => void) {
		this.f = f;
	}

	execute(context: IContext) {
		this.f(context);
	}
}
