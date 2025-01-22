import { AreaSize, ContainerArea, LeafArea, Orientation, Workspace, type IArea } from ".";
import { v4 as uuidv4 } from "uuid";
import { BroadcastPipe, type IPipe } from "./bus";
import type { None } from "../common/none";

enum WorkspaceNodeType {
	Leaf,
	Container,
}

interface IWorkspaceNode {
	type: WorkspaceNodeType;
	left: IWorkspaceNode | null;
	right: IWorkspaceNode | null;
	orientation: Orientation | null;
	leftSize: AreaSize | null;
	rightSize: AreaSize | null;
	context: object | null;
}

export interface IWorkpsaceIndex {
	id: string;
	name: string;
}

interface IWorkspaceEntry extends IWorkpsaceIndex {
	root: IWorkspaceNode;
}

export interface IWorkspaceRepository {
	set: (entry: IWorkspaceEntry) => Promise<boolean>;
	getIndex: () => Promise<IWorkpsaceIndex[]>;
	get: (id: string) => Promise<IWorkspaceEntry | null>;
}

export class LocalStorageWorkspaceRepository implements IWorkspaceRepository {
	private prefix = "blen-workspaces";

	async set(entry: IWorkspaceEntry): Promise<boolean> {
		const index = this.getdb<IWorkpsaceIndex[]>(this.key("index")) ?? [];

		const exists = index.findIndex((x) => x.id === entry.id);
		const indexElement = {
			id: entry.id,
			name: entry.name,
		};
		if (exists >= 0) index[exists] = indexElement;
		else index.push(indexElement);

		this.setdb(this.key("index"), index);
		this.setdb(this.key(entry.id), entry);

		return true;
	}

	async getIndex(): Promise<IWorkpsaceIndex[]> {
		return this.getdb<IWorkpsaceIndex[]>(this.key("index")) ?? [];
	}

	async get(id: string): Promise<IWorkspaceEntry | null> {
		return this.getdb<IWorkspaceEntry>(this.key(id));
	}

	private key(value: string) {
		return `${this.prefix}_${value}`;
	}

	private getdb<T>(key: string): T | null {
		const item = localStorage.getItem(key);
		if (item === null) {
			return null;
		}
		try {
			return JSON.parse(item) as T;
		} catch (error) {
			console.error("Error parsing JSON from localStorage:", error);
			return null;
		}
	}

	private setdb<T>(key: string, value: T): void {
		localStorage.setItem(key, JSON.stringify(value));
	}
}

export class WorkspaceService {
	private workspaces: Map<string, Workspace> = new Map();
	private index: IWorkpsaceIndex[] = [];
	private repository: IWorkspaceRepository;
	_active: string | undefined;
	update: IPipe<None> = new BroadcastPipe();

	constructor(repository: IWorkspaceRepository) {
		this.repository = repository;
		window.addEventListener("unload", () => {
			for (const item of this.workspaces) {
				const entry = this.toEntry(item[1]);
				if (!entry) continue;
				this.repository.set(entry);
			}
		});
	}

	async restore(): Promise<boolean> {
		const index = await this.repository.getIndex();
		if (!index || index.length === 0) {
			return false;
		}
		this.index = index;
		return await this.load(index[0]);
	}

	async add(name: string, workspace: Workspace) {
		const index = { id: uuidv4(), name };
		this.addInternal(index, workspace);
		const entry = this.toEntry(workspace);
		if (!entry) throw new Error("failed to create workspace entry to store");
		await this.repository.set(entry);
		this.change(index.id);
	}

	active(): Workspace | undefined {
		return this._active ? this.workspaces.get(this._active) : undefined;
	}

	count(): number {
		return this.workspaces.size;
	}

	async change(id: string) {
		if (!this.workspaces.has(id)) await this.load(this.index.find((x) => x.id === id)!);
		this._active = id;
		this.update.push({});
	}

	getIndex(): IWorkpsaceIndex[] {
		return this.index;
	}

	private async load(index: IWorkpsaceIndex): Promise<boolean> {
		const entry = await this.repository.get(index.id);
		if (!entry) return false;
		const area = this.convertNode(entry.root);
		this.addInternal(index, new Workspace(area));
		if (!this._active) {
			this.change(index.id);
		}
		return true;
	}

	private addInternal(index: IWorkpsaceIndex, workspace: Workspace) {
		if (!this.index.find((x) => x.id === index.id)) this.index.push(index);
		this.workspaces.set(index.id, workspace);
	}

	private toEntry(workspace: Workspace): IWorkspaceEntry | undefined {
		const id = this.getWorkspaceId(workspace);
		const name = this.index.find((x) => x.id === id)?.name;
		if (!name || !id) return undefined;
		const root: IWorkspaceEntry = {
			id,
			name,
			root: this.convertArea(workspace.root),
		};

		return root;
	}

	private convertArea(area: IArea): IWorkspaceNode {
		if (area instanceof LeafArea) {
			return {
				type: WorkspaceNodeType.Leaf,
				context: area.context,
				left: null,
				right: null,
				orientation: null,
				leftSize: null,
				rightSize: null,
			};
		}
		if (area instanceof ContainerArea) {
			return {
				type: WorkspaceNodeType.Container,
				context: null,
				left: this.convertArea(area.left),
				right: this.convertArea(area.right),
				orientation: area.orientation,
				leftSize: area.leftSize as AreaSize,
				rightSize: area.rightSize as AreaSize,
			};
		}
		throw new Error("area is undefined");
	}

	private convertNode(entry: IWorkspaceNode): IArea {
		if (entry.type === WorkspaceNodeType.Leaf) {
			return new LeafArea(entry.context);
		}
		if (entry.type === WorkspaceNodeType.Container) {
			return new ContainerArea(
				entry.orientation!,
				this.convertNode(entry.left!),
				this.convertNode(entry.right!),
				new AreaSize(entry.leftSize!.size, entry.leftSize!.unit),
				new AreaSize(entry.rightSize!.size, entry.rightSize!.unit),
			);
		}
		throw new Error("entry has not implemented type");
	}

	private getWorkspaceId(workspace: Workspace): string | undefined {
		for (const [key, value] of this.workspaces.entries()) {
			if (value === workspace) return key;
		}
		return undefined;
	}
}
