import type { Project } from "@/types";
import { p1Projects } from "./p1-projects";
import { p2Projects } from "./p2-projects";
import { p3Projects } from "./p3-projects";

export const projects: Project[] = [...p1Projects, ...p2Projects, ...p3Projects];
