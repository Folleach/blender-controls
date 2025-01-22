import type { Meta, StoryObj } from "@storybook/vue3";
import { fn } from "@storybook/test";

import TabList from "./TabList.vue";

const meta = {
	component: TabList,
	argTypes: {},
	args: {},
} satisfies Meta<typeof TabList>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
	args: {
		tabs: [
			{
				text: "First (selected)",
				active: true,
				execute: fn(),
			},
			{
				text: "Second",
				active: false,
				execute: fn(),
			},
			{
				text: "Third multi word",
				active: false,
				execute: fn(),
			},
			{
				text: "yet another larege lorem ipsum tab",
				active: false,
				execute: fn(),
			},
		],
	},
};
export const WithAppend: Story = {
	args: {
		tabs: [
			{
				text: "First (selected)",
				active: true,
				execute: fn(),
			},
		],
		append: fn(),
	},
};
