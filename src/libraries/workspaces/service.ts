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
	id: string | null;
	left: IWorkspaceNode | null;
	right: IWorkspaceNode | null;
	orientation: Orientation | null;
	leftSize: AreaSize | null;
	rightSize: AreaSize | null;
	context: object | null;
	windowId: string | null;
}

export interface IWorkspaceIndex {
	id: string;
	name: string;
}

interface IWorkspaceEntry extends IWorkspaceIndex {
	root: IWorkspaceNode;
}

export interface IWorkspaceRepository {
	set: (entry: IWorkspaceEntry) => Promise<boolean>;
	remove: (id: string) => Promise<boolean>;
	getIndex: () => Promise<IWorkspaceIndex[]>;
	get: (id: string) => Promise<IWorkspaceEntry | null>;
}

export class InMemoryWorkspaceRepository implements IWorkspaceRepository {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async set(entry: IWorkspaceEntry): Promise<boolean> {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async remove(id: string): Promise<boolean> {
		return false;
	}

	async getIndex(): Promise<IWorkspaceIndex[]> {
		return [];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async get(id: string): Promise<IWorkspaceEntry | null> {
		return null;
	}
}

export class LocalStorageWorkspaceRepository implements IWorkspaceRepository {
	private prefix = "blen-workspaces";

	async set(entry: IWorkspaceEntry): Promise<boolean> {
		const index = this.getdb<IWorkspaceIndex[]>(this.key("index")) ?? [];

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

	async getIndex(): Promise<IWorkspaceIndex[]> {
		return this.getdb<IWorkspaceIndex[]>(this.key("index")) ?? [];
	}

	async get(id: string): Promise<IWorkspaceEntry | null> {
		return this.getdb<IWorkspaceEntry>(this.key(id));
	}

	async remove(id: string): Promise<boolean> {
		const index = this.getdb<IWorkspaceIndex[]>(this.key("index")) ?? [];

		const element = index.find((x) => x.id === id);
		if (!element) return false;
		this.removedb(this.key(element.id));

		this.setdb(
			this.key("index"),
			index.filter((x) => x.id !== id),
		);
		return true;
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

	private removedb(key: string): void {
		localStorage.removeItem(key);
	}
}

export class WorkspaceService {
	private workspaces: Map<string, Workspace> = new Map();
	private index: IWorkspaceIndex[] = [];
	private repository: IWorkspaceRepository;
	_active: string | undefined;
	update: IPipe<string, None> = new BroadcastPipe();

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

	async add(name: string, workspace: Workspace): Promise<string> {
		const index = { id: uuidv4(), name };
		this.addInternal(index, workspace);
		const entry = this.toEntry(workspace);
		if (!entry) throw new Error("failed to create workspace entry to store");
		await this.repository.set(entry);
		this.change(index.id);
		return index.id;
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

	getIndex(): IWorkspaceIndex[] {
		return this.index;
	}

	async remove(id: string) {
		await this.repository.remove(id);
		this.workspaces.delete(id);
		this.index = this.index.filter((x) => x.id !== id);
		this.update.push({});
	}

	private async load(index: IWorkspaceIndex): Promise<boolean> {
		const entry = await this.repository.get(index.id);
		if (!entry) return false;
		const area = this.convertNode(entry.root);
		this.addInternal(index, new Workspace(area));
		if (!this._active) {
			this.change(index.id);
		}
		return true;
	}

	private addInternal(index: IWorkspaceIndex, workspace: Workspace) {
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
				id: area.id,
				context: area.context,
				windowId: area.windowId,
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
				id: null,
				context: null,
				windowId: null,
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
			return new LeafArea(entry.id!, entry.windowId ?? "default", entry.context);
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
