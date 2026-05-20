import { Project } from "./project";

export interface Profile {
    id: string;
    name: string;
    role: string;
    location: string;
    verified: boolean;
    mondialScore: string;
    experience: string;
    bio: string;
    vision: string;
    tags: string[];
    prevProjects: string[];
    projects: Project[];
}