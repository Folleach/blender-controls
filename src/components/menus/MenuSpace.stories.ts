import type { Meta, StoryObj } from "@storybook/vue3";

import MenuSpace from "./MenuSpace.vue";
import { MenuService } from "@/libraries/menus/service";
import { Menu, MenuDirectoryElement, MenuLeaf, MenuSeparatorElement } from "@/libraries/menus";
import { AdHocCommand } from "@/libraries/commands/adhocCommand";
import { fn } from "@storybook/test";
import type { Position } from "@/libraries/workspaces";

const meta = {
	component: MenuSpace,
	argTypes: {},
	args: {},
	decorators: [
		() => ({
			template: `<div>
                <h3>Click W or E on keyboard to open different context menus</h3>
            </div>
            <div style="position: absolute" class="c-full">
                <story />
            </div>`,
		}),
	],
} satisfies Meta<typeof MenuSpace>;

const menuW = new Menu([
	new MenuLeaf("Open", new AdHocCommand(fn())),
	new MenuDirectoryElement(
		"Open Recent",
		new Menu([
			new MenuLeaf("work final final", new AdHocCommand(fn())),
			new MenuLeaf("work final", new AdHocCommand(fn())),
			new MenuLeaf("my work", new AdHocCommand(fn())),
		]),
	),
	new MenuSeparatorElement(),
	new MenuLeaf("Preferences", new AdHocCommand(fn())),
]);

const menuE = new Menu([new MenuLeaf("Rotate Left", new AdHocCommand(fn())), new MenuLeaf("Rotate Right", new AdHocCommand(fn()))]);

const service = new MenuService();

export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
	args: {
		service,
	},
};

let position: Position = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
	position = { x: e.pageX - 20, y: e.pageY - 18 };
});
window.addEventListener("keydown", (e) => {
	if (e.key === "w") {
		service.set(position, menuW, { message: "This is context from W key" });
	}
	if (e.key === "e") {
		service.set(position, menuE, { message: "This is another context" });
	}
});
