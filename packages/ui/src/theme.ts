import type { Theme } from '@blender-controls/core';

export function applyTheme(theme: Theme, element: HTMLElement = document.documentElement): void {
	for (const [name, value] of Object.entries(theme))
		element.style.setProperty(name, value);
}

export function removeTheme(theme: Theme, element: HTMLElement = document.documentElement): void {
	for (const name of Object.keys(theme))
		element.style.removeProperty(name);
}

// https://stephango.com/flexoki
export const flexokiPalette: Theme = {
	'--flexoki-black': '#100f0f',
	'--flexoki-paper': '#fffcf0',

	'--flexoki-50': '#f2f0e5',
	'--flexoki-100': '#e6e4d9',
	'--flexoki-150': '#dad8ce',
	'--flexoki-200': '#cecdc3',
	'--flexoki-300': '#b7b5ac',
	'--flexoki-400': '#9f9d96',
	'--flexoki-500': '#878580',
	'--flexoki-600': '#6f6e69',
	'--flexoki-700': '#575653',
	'--flexoki-800': '#403e3c',
	'--flexoki-850': '#343331',
	'--flexoki-900': '#282726',
	'--flexoki-950': '#1c1b1a',

	'--flexoki-red-400': '#d14d41',
	'--flexoki-red-600': '#af3029',
	'--flexoki-orange-400': '#da702c',
	'--flexoki-orange-600': '#bc5215',
	'--flexoki-yellow-400': '#d0a215',
	'--flexoki-yellow-600': '#ad8301',
	'--flexoki-green-400': '#879a39',
	'--flexoki-green-600': '#66800b',
	'--flexoki-cyan-400': '#3aa99f',
	'--flexoki-cyan-600': '#24837b',
	'--flexoki-cyan-900': '#122f2c',
	'--flexoki-blue-400': '#4385be',
	'--flexoki-blue-600': '#205ea6',
	'--flexoki-blue-950': '#101a24',
	'--flexoki-purple-400': '#8b7ec8',
	'--flexoki-purple-600': '#5e409d',
	'--flexoki-magenta-400': '#ce5d97',
	'--flexoki-magenta-600': '#a02f6f',
};

export const flexokiDark: Theme = {
	'--blen-background': 'var(--flexoki-black)',
	'--blen-panel': 'var(--flexoki-950)',
	'--blen-surface': 'var(--flexoki-900)',
	'--blen-control': 'var(--flexoki-850)',
	'--blen-control-hover': 'var(--flexoki-800)',
	'--blen-text': 'var(--flexoki-200)',
	'--blen-text-muted': 'var(--flexoki-500)',
	'--blen-text-strong': 'var(--flexoki-paper)',
	'--blen-accent': 'var(--flexoki-blue-400)',
	'--blen-node-header': 'var(--flexoki-cyan-900)',
	'--blen-relation': 'var(--flexoki-magenta-600)',
	'--blen-socket-input': 'var(--flexoki-orange-600)',
	'--blen-socket-output': 'var(--flexoki-blue-600)',
};
