import type { IContext } from "../contexts";
import type { ICommand } from "./commands";

export class ConsoleCommand implements ICommand {
	execute(context: IContext) {
		console.log(context);
	}
}
