import { clamp } from '@blender-controls/core';
import { arrowRightIcon } from '../icons.ts';
import { lockedDrag } from '../pointer.ts';
import { css, html, query, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
:host {
	display: inline-block;
	min-width: 8rem;
	border-radius: 0.2rem;
	outline: none;
}

.field {
	position: relative;
	display: grid;
	grid-template-columns: auto 1fr;
	align-items: center;
	height: var(--blen-control-height, 20px);
	padding: 0 1rem;
	border-radius: inherit;
	background: ${vars.control};
	color: ${vars.textStrong};
	user-select: none;
	cursor: col-resize;
	touch-action: none;
}

.field:hover,
:host(:focus-visible) .field {
	background: ${vars.controlHover};
}

:host([dragging]) .field {
	background: ${vars.accent};
}

.label {
	white-space: nowrap;
}

.value {
	text-align: right;
	white-space: nowrap;
}

.label:empty + .value {
	grid-column: 1 / -1;
	text-align: center;
}

.arrow {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 14px;
	display: none;
	align-items: center;
	justify-content: center;
	cursor: default;
}

.arrow:hover {
	background: ${vars.control};
}

.field:hover .arrow {
	display: flex;
}

.arrow.left { left: 0; }
.arrow.left svg { transform: scaleX(-1); }
.arrow.right { right: 0; }

input {
	position: absolute;
	inset: 0;
	box-sizing: border-box;
	width: 100%;
	padding: 0 0.5rem;
	border: none;
	border-radius: inherit;
	outline: 1px solid ${vars.accent};
	font: inherit;
	color: inherit;
	background: ${vars.surface};
}
`;

const markup = html`
<div class="field" part="field">
	<div class="arrow left" data-step="-1">${arrowRightIcon}</div>
	<span class="label" part="label"></span>
	<span class="value" part="value"></span>
	<div class="arrow right" data-step="1">${arrowRightIcon}</div>
	<input part="input" hidden />
</div>
`;

const DRAG_THRESHOLD = 3;

export class NumberFieldElement extends HTMLElement {
	static readonly observedAttributes = ['value', 'min', 'max', 'step', 'precision', 'unit', 'label'];

	private readonly field: HTMLElement;
	private readonly labelView: HTMLElement;
	private readonly valueView: HTMLElement;
	private readonly input: HTMLInputElement;
	private requested = 0;
	private _value = 0;

	constructor() {
		super();
		const root = shadow(this, styles, markup);
		this.field = query(root, '.field');
		this.labelView = query(root, '.label');
		this.valueView = query(root, '.value');
		this.input = query<HTMLInputElement>(root, 'input');

		this.field.addEventListener('pointerdown', event => this.pointerDown(event));
		this.input.addEventListener('keydown', event => {
			if (event.key === 'Enter')
				this.endEdit(true);
			else if (event.key === 'Escape')
				this.endEdit(false);
		});
		this.input.addEventListener('blur', () => this.endEdit(true));
		this.addEventListener('keydown', event => {
			if (event.target !== this)
				return;
			if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
				this.stepBy(-1);
			else if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
				this.stepBy(1);
			else if (event.key === 'Enter')
				this.beginEdit();
			else
				return;
			event.preventDefault();
		});
	}

	get value(): number {
		return this._value;
	}

	set value(value: number) {
		this.requested = value;
		this._value = this.coerce(value);
		this.render();
	}

	get min(): number {
		return numberAttribute(this, 'min', Number.NEGATIVE_INFINITY);
	}

	get max(): number {
		return numberAttribute(this, 'max', Number.POSITIVE_INFINITY);
	}

	get step(): number {
		const step = numberAttribute(this, 'step', 1);
		return step > 0 ? step : 1;
	}

	get precision(): number {
		const explicit = this.getAttribute('precision');
		if (explicit !== null)
			return Math.max(0, Math.floor(Number(explicit)) || 0);
		const text = String(this.step);
		const exponent = /e-(\d+)$/.exec(text);
		if (exponent)
			return Number(exponent[1]);
		return text.split('.')[1]?.length ?? 0;
	}

	connectedCallback(): void {
		if (!this.hasAttribute('tabindex'))
			this.tabIndex = 0;
		this.render();
	}

	attributeChangedCallback(name: string): void {
		if (name === 'value')
			this.requested = numberAttribute(this, 'value', 0);
		this._value = this.coerce(this.requested);
		this.render();
	}

	private coerce(value: number): number {
		if (!Number.isFinite(value))
			value = 0;
		const stepped = Math.round(value / this.step) * this.step;
		return clamp(Number(stepped.toFixed(this.precision)), this.min, this.max);
	}

	private render() {
		this.labelView.textContent = this.getAttribute('label') ?? '';
		const unit = this.getAttribute('unit');
		this.valueView.textContent = `${this._value.toFixed(this.precision)}${unit ? ` ${unit}` : ''}`;
		this.setAttribute('aria-valuenow', String(this._value));
	}

	private update(value: number, type: 'input' | 'change') {
		const next = this.coerce(value);
		if (next === this._value && type === 'input')
			return;
		this.requested = next;
		this._value = next;
		this.render();
		this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
	}

	private stepBy(direction: number) {
		this.update(this._value + direction * this.step, 'change');
	}

	private pointerDown(event: PointerEvent) {
		if (event.button !== 0 || !this.input.hidden)
			return;
		event.preventDefault();
		this.focus();
		const arrow = (event.target as HTMLElement).closest<HTMLElement>('[data-step]');
		const start = this._value;
		let travelled = 0;
		let dragging = false;

		lockedDrag(event, this.field, {
			move: delta => {
				travelled += delta.x;
				if (!dragging && Math.abs(travelled) < DRAG_THRESHOLD)
					return;
				dragging = true;
				this.toggleAttribute('dragging', true);
				this.update(start + Math.round(travelled) * this.step, 'input');
			},
			end: () => {
				this.toggleAttribute('dragging', false);
				if (dragging)
					this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
				else if (arrow)
					this.stepBy(Number(arrow.dataset.step));
				else
					this.beginEdit();
			},
		});
	}

	private beginEdit() {
		this.input.value = this._value.toFixed(this.precision);
		this.input.hidden = false;
		this.input.focus();
		this.input.select();
	}

	private endEdit(commit: boolean) {
		if (this.input.hidden)
			return;
		this.input.hidden = true;
		const parsed = Number(this.input.value.replace(',', '.'));
		if (commit && this.input.value.trim() !== '' && Number.isFinite(parsed))
			this.update(parsed, 'change');
		this.focus();
	}
}

function numberAttribute(target: Element, name: string, fallback: number): number {
	const raw = target.getAttribute(name);
	if (raw === null || raw.trim() === '')
		return fallback;
	const value = Number(raw);
	return Number.isFinite(value) ? value : fallback;
}
