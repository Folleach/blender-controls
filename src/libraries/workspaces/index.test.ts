import { ContainerArea, LeafArea, Orientation, Side, Workspace } from "../src";

test("root should be container", () => {
	const workspace = Workspace.buildDefault();

	expect(workspace.root.type).toBe("container");
});

test("right should be leaf", () => {
	const workspace = Workspace.buildDefault();

	expect(workspace.root).toBeInstanceOf(ContainerArea);

	expect((<ContainerArea>workspace.root).right).toBeInstanceOf(LeafArea);
});

test("find sibling", () => {
	const leftFirst = new LeafArea<string>("hello");
	const leftSecond = new LeafArea<string>("world");
	const left = new ContainerArea(Orientation.Vertical, leftFirst, leftSecond);
	const right = new LeafArea<string>("right");
	const root = new ContainerArea(Orientation.Horizontal, left, right);
	const workspace = new Workspace(root);

	const actual1 = workspace.findSiblingContainer(leftSecond, Side.Right);
	expect(actual1).toBe(root);

	const actual2 = workspace.findSiblingContainer(leftSecond, Side.Top);
	expect(actual2).toBe(left);

	const actual3 = workspace.findSiblingContainer(leftFirst, Side.Right);
	expect(actual3).toBe(root);
});

test("find sibling in many horizontal areas", () => {
	const a1 = new LeafArea<string>("a1");
	const a2 = new LeafArea<string>("a2");
	const a3 = new LeafArea<string>("a3");
	const a4 = new LeafArea<string>("a4");
	const a5 = new LeafArea<string>("a5");

	const c1 = new ContainerArea(Orientation.Horizontal, a1, a2);
	const c2 = new ContainerArea(Orientation.Horizontal, c1, a3);
	const c3 = new ContainerArea(Orientation.Horizontal, c2, a4);
	const root = new ContainerArea(Orientation.Horizontal, c3, a5);
	const workspace = new Workspace(root);

	const actual1 = workspace.findSiblingContainer(a1, Side.Top);
	expect(actual1).toBeUndefined();

	const actual2 = workspace.findSiblingContainer(a2, Side.Bottom);
	expect(actual2).toBeUndefined();

	const actual3 = workspace.findSiblingContainer(a2, Side.Left);
	expect(actual3).toBe(c1);

	const actual4 = workspace.findSiblingContainer(a4, Side.Right);
	expect(actual4).toBe(root);
});

test("find sibling: discord example", () => {
	const a1 = new LeafArea<string>("hello");
	const a2 = new LeafArea<string>("world");
	const a3 = new LeafArea<string>("right");
	const a4 = new LeafArea<string>("additional");
	const c1 = new ContainerArea(Orientation.Vertical, a1, a2);
	const c2 = new ContainerArea(Orientation.Horizontal, a3, a4);
	const root = new ContainerArea(Orientation.Horizontal, c1, c2);
	const workspace = new Workspace(root);

	expect(workspace.findSiblingContainer(a3, Side.Right)).toBe(c2);
	expect(workspace.findSiblingContainer(a1, Side.Right)).toBe(root);
	expect(workspace.findSiblingContainer(a1, Side.Bottom)).toBe(c1);
	expect(workspace.findSiblingContainer(a2, Side.Top)).toBe(c1);
	expect(workspace.findSiblingContainer(a1, Side.Left)).toBeUndefined();
	expect(workspace.findSiblingContainer(a3, Side.Left)).toBe(root);
});
