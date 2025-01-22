import type { Position } from "../workspaces";

let x = 0;
let y = 0;

window.addEventListener("pointermove", (e) => {
	x = e.pageX;
	y = e.pageY;
});

export function getPointerPosition(): Position {
	return { x, y };
}
