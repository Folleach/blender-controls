import type { Meta, StoryObj } from "@storybook/vue3";

import MenuContainer from "./MenuContainer.vue";

const meta = {
	component: MenuContainer,
	argTypes: {},
	args: {},
} satisfies Meta<typeof MenuContainer>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
	args: {},
};
