export type Unit = string;

export interface INumberFieldProps {
	unit: Unit;
	max?: number | undefined;
	min?: number | undefined;
	denominator?: number | undefined;
	scale?: number | undefined;
	title?: string | undefined;
}
