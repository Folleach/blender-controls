import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";

export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		AutoImport({
			imports: ["vue", "vue-router"],
			dirs: ["./composables"],
			vueTemplate: true,
		}),
		Components({
			dirs: ["./components/"],
			dts: true,
			directoryAsNamespace: true,
		}),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
