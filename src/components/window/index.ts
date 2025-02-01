import ComponentNotFound from "@/areas/ComponentNotFound.vue";
import { defineComponent, type DefineComponent } from "vue";

export type ComponentFactory = () => ReturnType<typeof defineComponent>;

export interface IAreaSettings<T> {
	name: string;
	defaultContext: T;
}

export interface IAreaForCreation {
	id: string;
	name: string;
}

export interface IAreaApi {
	registerArea: <T>(id: string, area: IAreaSettings<T>, factory: ComponentFactory) => void;
}

interface IComponentHolder {
	settings: IAreaSettings<unknown>;
	factory: ComponentFactory;
}

export class InitAreaService implements IAreaApi {
	private areas: Map<string, IComponentHolder> = new Map();

	constructor() {}

	registerArea<T>(id: string, area: IAreaSettings<T>, factory: ComponentFactory) {
		this.areas.set(id, { settings: area, factory });
	}

	*getAreas(): Iterable<IAreaForCreation> {
		for (const item of this.areas)
			yield {
				id: item[0],
				name: item[1].settings.name,
			};
	}

	create(id: string): DefineComponent {
		const area = this.areas.get(id);
		const factory = area?.factory;
		if (factory) {
			return factory();
		}

		console.error("failed to find component", id);
		return <DefineComponent>ComponentNotFound;
	}
}
