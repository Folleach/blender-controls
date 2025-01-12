import type { Meta, StoryObj } from "@storybook/vue3";

import WorkspaceComponent from "./WorkspaceComponent.vue";

const meta = {
	component: WorkspaceComponent,
	argTypes: {},
	args: {},
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof WorkspaceComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {},
	render(args) {
		return {
			components: { WorkspaceComponent },
			setup() {
				return { args };
			},
			template: `
          <div style="height: 100vh">
              <WorkspaceComponent />
          </div>
        `,
		};
	},
};
