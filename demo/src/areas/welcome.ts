import { defineDomArea } from '@blender-controls/ui';
import { h } from '../dom.ts';

interface Contributor {
	avatar_url: string;
	html_url: string;
	contributions: number;
	type: string;
}

export const welcomeArea = (reset: () => void) => defineDomArea(
	'blen.demo.welcome',
	context => {
		const contributors = h('div', { class: 'row' });
		const element = h(
			'div',
			{ class: 'centered', style: 'font-size: 2em' },
			h('h1', {}, 'Hello ', h('span', { style: 'font-family: serif' }, '^_^')),
			h(
				'p',
				{},
				'This is a demo of the ',
				h('a', { href: 'https://github.com/Folleach/blender-controls' }, h('code', {}, 'blender-controls')),
				' library!',
			),
			h('p', {}, 'Feel free to explore the tabs above to get to know the library better.'),
			h('blen-button', { onclick: reset, style: '--blen-control-height: 1.7em' }, 'Reset Local Storage State'),
			h('h2', {}, 'License'),
			h('p', {}, 'Apache-2.0'),
			h('h2', {}, 'Contributors'),
			contributors,
		);

		const abort = new AbortController();
		context.lifetime.add(() => abort.abort());
		fetch('https://api.github.com/repos/folleach/blender-controls/contributors', { signal: abort.signal })
			.then(response => (response.ok ? (response.json() as Promise<Contributor[]>) : []))
			.then(data => {
				const users = data
					.filter(x => x.type.toLowerCase() === 'user')
					.sort((a, b) => b.contributions - a.contributions);
				contributors.replaceChildren(
					...users.map(user =>
						h(
							'a',
							{ href: user.html_url, target: '_blank' },
							h('img', { src: user.avatar_url, width: '64', style: 'border-radius: 100%' }),
						),
					),
				);
			})
			.catch(() => {});

		return { element };
	},
	{ name: '[Demo] Welcome' },
);
