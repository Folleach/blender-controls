import { AreaSize, ContainerArea, LeafArea, Orientation, type AreaId, type IArea, type Workspace } from ".";

export class Area {
	private _id: string;

	constructor(id: string) {
		this._id = id;
	}

	get id() {
		return this._id;
	}
}

export interface IWorkspaceApi {
	swapTo: (id: string) => void;
	split: <T>(orientation: Orientation, id: AreaId, windowId: string, context: T) => Area;
	close: (id: AreaId) => void;
	getContext: <T>() => T | undefined;
	setContext: <T>(context: T) => void;
}

export class WorkspaceApi implements IWorkspaceApi {
	private workspace: Workspace;
	private area: IArea;

	constructor(workspace: Workspace, area: IArea) {
		this.workspace = workspace;
		this.area = area;
	}

	swapTo(id: string) {
		this.workspace.swap(this.area, id, "context");
	}

	split<T>(orientation: Orientation, id: AreaId, windowId: string, context: T): Area {
		this.workspace.split(this.area, {
			appendArea: new LeafArea<T>(id, windowId, context),
			firstSize: new AreaSize(1, "fr"),
			secondSize: new AreaSize(1, "fr"),
			left: false,
			orientation: orientation,
		});
		return new Area(id);
	}

	close(id: AreaId) {
		const stack = [this.workspace.root];
		while (stack.length > 0) {
			const current = stack.pop();
			if (current instanceof ContainerArea) {
				stack.push(current.left);
				stack.push(current.right);
				continue;
			}
			if (current instanceof LeafArea && id === current.id) {
				this.workspace.remove(current);
				return;
			}
		}
	}

	getContext<T>(): T | undefined {
		const leaf = <LeafArea<T>>this.area;
		if (!leaf) return undefined;
		return leaf.context;
	}

	setContext<T>(context: T) {
		const leaf = <LeafArea<T>>this.area;
		if (!leaf) return;
		leaf.context = context;
	}
}
