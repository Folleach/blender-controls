import { html } from './style.ts';

export const addIcon = html`<svg class="icon" width="12" height="12" viewBox="0 0 1100 1100" aria-hidden="true"><path fill="currentColor" d="m118.51367 601a.50005001.50005001 0 0 0 -.50586.50586v3.50195h-3.50195a.50005001.50005001 0 1 0 0 .99805h3.50195v3.50195a.50005001.50005001 0 1 0 .99805 0v-3.50195h3.50195a.50005001.50005001 0 1 0 0-.99805h-3.50195v-3.50195a.50005001.50005001 0 0 0 -.49219-.50586z" transform="matrix(99.99975 0 0 99.99975 -11300.654 -60001.84)"/></svg>`;

export const disclosureRightIcon = html`<svg class="icon" width="12" height="10" viewBox="0 0 800 1000" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="m94.50586 623c-.27842 0-.50585.2216-.50586.5v7c-.00061.4051.45544.6427.78711.4102l5-3.5c.28542-.199.28542-.6214 0-.8204l-5-3.5c-.0826-.058-.1806-.089-.28125-.09z" transform="matrix(100 0 0 100 -9300 -62200)"/></svg>`;

export const arrowRightIcon = html`<svg class="icon" width="10" height="10" viewBox="0 0 700 1100" aria-hidden="true"><path fill="currentColor" d="m53.494141 601.99414a.50005.50005 0 0 0 -.347657.85938l3.646485 3.64648-3.646485 3.64648a.50005.50005 0 1 0 .707032.70704l4-4a.50005.50005 0 0 0 0-.70704l-4-4a.50005.50005 0 0 0 -.359375-.15234z" transform="matrix(100 0 0 100 -5199.6393 -60100.063)"/></svg>`;

export const duplicateIcon = html`<svg class="icon" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><g fill="currentColor"><path d="M-467.5 287a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h2.5v-1h-2v-9h9v2h1v-2.5a.5.5 0 0 0-.5-.5z" transform="matrix(1 0 0 -1 471 304)"/><path d="M-463.5 301a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v4.5h-1v-4h-8v8h5v-2.5a.5.5 0 0 1 .5-.5h3.5v.5a.5.5 0 0 1-.147.354l-3 3a.5.5 0 0 1-.353.146z" transform="matrix(1 0 0 -1 471 304)"/></g></svg>`;

export const icons: Readonly<Record<string, string>> = {
	'add': addIcon,
	'disclosure-right': disclosureRightIcon,
	'arrow-right': arrowRightIcon,
	'duplicate': duplicateIcon,
};
