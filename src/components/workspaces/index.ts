import type { IWorkspaceApi } from "@/libraries/workspaces/api";
import type { InjectionKey } from "vue";

export const WORKSPACE_API = Symbol() as InjectionKey<IWorkspaceApi>;
