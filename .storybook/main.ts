export default {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: ["@storybook/addon-onboarding", "@storybook/addon-essentials", "@chromatic-com/storybook", "@storybook/addon-interactions"],
	framework: {
		name: "@storybook/vue3-vite",
		options: {},
	},
	async viteFinal(config) {
		const { mergeConfig } = await import("vite");

		return mergeConfig(config, {
			base: "blender-controls/storybook/",
		});
	},
};
