import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		// use the sibling packages from source
		conditions: ['source'],
	},
	test: {
		environment: 'happy-dom',
	},
});
