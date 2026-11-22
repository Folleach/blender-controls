import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
	base: './',
	publicDir: '../public',
	resolve: {
		conditions: ['source', ...defaultClientConditions],
	},
	server: {
		host: true,
	},
});
