import { DragSession } from '@blender-controls/core';
import type { Disposable, Position, PositionAlignment } from '@blender-controls/core';

export interface PointerHoldHandlers {
	move(event: PointerEvent): void;
	end?(event: PointerEvent | undefined, cancelled: boolean): void;
}

export interface PointerHoldOptions {
	cursor?: string;
	container?: HTMLElement;
}

export function holdPointer(start: PointerEvent, handlers: PointerHoldHandlers, options: PointerHoldOptions = {}): Disposable {
	const catcher = document.createElement('div');
	const fixed = !options.container;
	Object.assign(catcher.style, {
		position: fixed ? 'fixed' : 'absolute',
		inset: '0',
		zIndex: '2147483647',
		cursor: options.cursor ?? 'default',
		pointerEvents: 'all',
		touchAction: 'none',
		userSelect: 'none',
	});
	(options.container ?? document.body).appendChild(catcher);

	let finished = false;
	const finish = (event: PointerEvent | undefined, cancelled: boolean) => {
		if (finished)
			return;
		finished = true;
		catcher.removeEventListener('pointermove', move);
		catcher.removeEventListener('pointerup', up);
		catcher.removeEventListener('pointercancel', cancel);
		catcher.removeEventListener('lostpointercapture', cancel);
		window.removeEventListener('pointerup', up);
		catcher.remove();
		handlers.end?.(event, cancelled);
	};
	const move = (event: PointerEvent) => {
		if (event.pointerId === start.pointerId)
			handlers.move(event);
	};
	const up = (event: PointerEvent) => {
		if (event.pointerId === start.pointerId)
			finish(event, false);
	};
	const cancel = (event: PointerEvent) => finish(event, true);

	catcher.addEventListener('pointermove', move);
	catcher.addEventListener('pointerup', up);
	catcher.addEventListener('pointercancel', cancel);
	// window.addEventListener('pointerup', up);
	try {
		catcher.setPointerCapture(start.pointerId);
		catcher.addEventListener('lostpointercapture', cancel);
	} catch {
	}
	window.getSelection()?.removeAllRanges();
	return () => finish(undefined, true);
}

export interface MoveOptions extends PointerHoldOptions {
	alignment?: PositionAlignment;
	end?: (cancelled: boolean) => void;
}

export function startMove(
	event: PointerEvent,
	origin: Position,
	set: (position: Position) => void,
	options: MoveOptions = {},
): Disposable {
	const session = new DragSession(origin, { x: event.clientX, y: event.clientY }, options.alignment);
	return holdPointer(
		event,
		{
			move: e => set(session.at({ x: e.clientX, y: e.clientY })),
			end: (_, cancelled) => options.end?.(cancelled),
		},
		{
			cursor: options.cursor ?? 'grabbing',
			container: options.container
		},
	);
}

export function lockedDrag(
	event: PointerEvent,
	target: HTMLElement,
	handlers: { move(delta: Position): void; end?(): void },
): Disposable {
	const root = target.getRootNode() as Document | ShadowRoot;
	const request = target.requestPointerLock?.() as Promise<void> | void;
	const locked = request && typeof request.then === 'function'
		? request.catch(() => {})
		: Promise.resolve();

	const move = (e: PointerEvent) => {
		if (e.pointerId === event.pointerId)
			handlers.move({ x: e.movementX, y: e.movementY });
	};
	let finished = false;
	const finish = () => {
		if (finished)
			return;
		finished = true;
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', up);
		document.removeEventListener('pointercancel', up);
		locked.then(() => {
			if (root.pointerLockElement === target)
				document.exitPointerLock();
		});
		handlers.end?.();
	};
	const up = (e: PointerEvent) => {
		if (e.pointerId === event.pointerId)
			finish();
	};
	document.addEventListener('pointermove', move);
	document.addEventListener('pointerup', up);
	document.addEventListener('pointercancel', up);
	return finish;
}
