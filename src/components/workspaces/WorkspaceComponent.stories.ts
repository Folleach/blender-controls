import type { Meta, StoryObj } from "@storybook/vue3";

import WorkspaceComponent from "./WorkspaceComponent.vue";
import { LocalStorageWorkspaceRepository, WorkspaceService } from "@/libraries/workspaces/service";
import { Workspace } from "@/libraries/workspaces";

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

const service = new WorkspaceService(new LocalStorageWorkspaceRepository());
service.add("first", Workspace.buildDefault());

export const Primary: Story = {
	args: {
		service,
	},
	render(args) {
		return {
			components: { WorkspaceComponent },
			setup() {
				return { args };
			},
			template: `
          <div style="height: 100vh">
              <WorkspaceComponent v-bind="args" />
          </div>
        `,
		};
	},
};
