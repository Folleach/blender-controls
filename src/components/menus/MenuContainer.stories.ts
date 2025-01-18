import type { Meta, StoryObj } from "@storybook/vue3";
import { fn } from "@storybook/test";

import MenuContainer from "./MenuContainer.vue";
import { Menu, MenuLeaf, MenuSeparatorElement } from "@/libraries/menus";
import { AdHocCommand } from "@/libraries/commands/adhocCommand";

const meta = {
	component: MenuContainer,
	argTypes: {},
	args: {},
} satisfies Meta<typeof MenuContainer>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Container: Story = {
	args: {
		menu: new Menu([
			new MenuLeaf("This", new AdHocCommand(fn())),
			new MenuLeaf("is", new AdHocCommand(fn())),
			new MenuLeaf("container", new AdHocCommand(fn())),
			new MenuSeparatorElement(),
			new MenuLeaf("example", new AdHocCommand(fn())),
		]),
		depth: 0,
	},
};
