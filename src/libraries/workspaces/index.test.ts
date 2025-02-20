import { expect, test } from "@jest/globals";
import { AreaSize, ContainerArea, INIT_AREA_ID, LeafArea, Orientation, Side, Workspace } from ".";
import { v4 } from "uuid";

function createCase1() {
	return new Workspace(
		new ContainerArea(
			Orientation.Horizontal,
			new ContainerArea(
				Orientation.Vertical,
				new LeafArea<string>(v4(), INIT_AREA_ID, "hello"),
				new LeafArea<string>(v4(), INIT_AREA_ID, "world"),
				new AreaSize(1, "fr"),
				new AreaSize(2, "fr"),
			),
			new LeafArea<string>(v4(), INIT_AREA_ID, "right"),
			new AreaSize(1, "fr"),
			new AreaSize(2, "fr"),
		),
	);
}

test("root should be container", () => {
	const workspace = createCase1();

	expect(workspace.root.type).toBe("container");
});

test("right should be leaf", () => {
	const workspace = createCase1();

	expect(workspace.root).toBeInstanceOf(ContainerArea);

	expect((<ContainerArea>workspace.root).right).toBeInstanceOf(LeafArea);
});

test("find sibling", () => {
	const leftFirst = new LeafArea(v4(), "hello", undefined);
	const leftSecond = new LeafArea(v4(), "world", undefined);
	const left = new ContainerArea(Orientation.Vertical, leftFirst, leftSecond, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const right = new LeafArea(v4(), "right", undefined);
	const root = new ContainerArea(Orientation.Horizontal, left, right, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const workspace = new Workspace(root);

	const actual1 = workspace.findSiblingContainer(leftSecond, Side.Right);
	expect(actual1).toBe(root);

	const actual2 = workspace.findSiblingContainer(leftSecond, Side.Top);
	expect(actual2).toBe(left);

	const actual3 = workspace.findSiblingContainer(leftFirst, Side.Right);
	expect(actual3).toBe(root);
});

test("find sibling in many horizontal areas", () => {
	const a1 = new LeafArea(v4(), "a1", undefined);
	const a2 = new LeafArea(v4(), "a2", undefined);
	const a3 = new LeafArea(v4(), "a3", undefined);
	const a4 = new LeafArea(v4(), "a4", undefined);
	const a5 = new LeafArea(v4(), "a5", undefined);

	const c1 = new ContainerArea(Orientation.Horizontal, a1, a2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c2 = new ContainerArea(Orientation.Horizontal, c1, a3, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c3 = new ContainerArea(Orientation.Horizontal, c2, a4, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const root = new ContainerArea(Orientation.Horizontal, c3, a5, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
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
	const a1 = new LeafArea(v4(), "hello", undefined);
	const a2 = new LeafArea(v4(), "world", undefined);
	const a3 = new LeafArea(v4(), "right", undefined);
	const a4 = new LeafArea(v4(), "additional", undefined);
	const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const workspace = new Workspace(root);

	expect(workspace.findSiblingContainer(a3, Side.Right)).toBe(c2);
	expect(workspace.findSiblingContainer(a1, Side.Right)).toBe(root);
	expect(workspace.findSiblingContainer(a1, Side.Bottom)).toBe(c1);
	expect(workspace.findSiblingContainer(a2, Side.Top)).toBe(c1);
	expect(workspace.findSiblingContainer(a1, Side.Left)).toBeUndefined();
	expect(workspace.findSiblingContainer(a3, Side.Left)).toBe(root);
});

test("find nearest leaf", () => {
	const a1 = new LeafArea(v4(), "hello", undefined);
	const a2 = new LeafArea(v4(), "world", undefined);
	const a3 = new LeafArea(v4(), "right", undefined);
	const a4 = new LeafArea(v4(), "additional", undefined);
	const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const workspace = new Workspace(root);

	expect(workspace.findNearestDescent(root, Side.Right)).toBe(a3);
	expect(workspace.findNearestDescent(root, Side.Left)).toBe(c1);
	expect(workspace.findNearestDescent(c1, Side.Top)).toBe(a1);
	expect(workspace.findNearestDescent(c1, Side.Bottom)).toBe(a2);
	expect(workspace.findNearestDescent(c2, Side.Left)).toBe(a3);
	expect(workspace.findNearestDescent(c2, Side.Right)).toBe(a4);
});

test("swap tree", () => {
	const a1 = new LeafArea(v4(), "hello", undefined);
	const a2 = new LeafArea(v4(), "world", undefined);
	const a3 = new LeafArea(v4(), "right", undefined);
	const a4 = new LeafArea(v4(), "additional", undefined);
	const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const workspace = new Workspace(root);

	workspace.swapTree(root);
	expect((workspace.root as ContainerArea).left).toBe(a3);
	expect((workspace.root as ContainerArea).right).toBe(c2);
	expect(((workspace.root as ContainerArea).right as ContainerArea).left).toBe(c1);
});

test("swap tree with one container", () => {
	const a1 = new LeafArea(v4(), "hello", undefined);
	const a2 = new LeafArea(v4(), "world", undefined);
	const c1 = new ContainerArea(Orientation.Horizontal, a1, a2, AreaSize.one, AreaSize.one);
	const workspace = new Workspace(c1);

	workspace.swapTree(c1);
	expect(c1.left).toBe(a2);
	expect(c1.right).toBe(a1);
});

test("remove: container", () => {
	const a1 = new LeafArea(v4(), "hello", undefined);
	const a2 = new LeafArea(v4(), "world", undefined);
	const a3 = new LeafArea(v4(), "right", undefined);
	const a4 = new LeafArea(v4(), "additional", undefined);
	const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const workspace = new Workspace(root);

	workspace.remove(c2);
	expect(workspace.root).toBe(c1);
});

test("remove: area", () => {
	const a1 = new LeafArea(v4(), "hello", undefined);
	const a2 = new LeafArea(v4(), "world", undefined);
	const a3 = new LeafArea(v4(), "right", undefined);
	const a4 = new LeafArea(v4(), "additional", undefined);
	const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
	const workspace = new Workspace(root);

	workspace.remove(a3);
	expect((workspace.root as ContainerArea).right).toBe(a4);
});
