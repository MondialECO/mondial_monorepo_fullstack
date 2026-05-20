import React from "react"
import { ArrowRight, Heart } from "lucide-react"
import { Project } from "@/types/creator/project"

const VerifiedBadge = ({ className }: { className?: string }) => (
    <svg width="20" height="20" aria-label="verify - 20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M19.58 7.95a1.85 1.85 0 0 0-.58-.96l-1.07-.92a.61.61 0 0 1-.22-.48v-1.38a1.86 1.86 0 0 0-.54-1.32 1.86 1.86 0 0 0-1.32-.54h-1.38a.61.61 0 0 1-.48-.22l-.92-1.07a1.86 1.86 0 0 0-1.41-.65 1.86 1.86 0 0 0-1.35.63l-1.25.62a.61.61 0 0 1-.52 0l-1.25-.62a1.86 1.86 0 0 0-1.1-.16 1.86 1.86 0 0 0-.96.58l-.92 1.07a.61.61 0 0 1-.48.22H3.14c-.5 0-.98.2-1.32.54A1.86 1.86 0 0 0 1.25 4.2v1.38c0 .18-.08.35-.22.48l-1.07.92a1.86 1.86 0 0 0-.58.96c-.08.37-.04.75.16 1.1l.62 1.25a.61.61 0 0 1 0 .52l-.62 1.25a1.86 1.86 0 0 0-.16 1.1c.08.36.29.69.58.96l1.07.92c.14.13.22.3.22.48v1.38c0 .5.2.98.54 1.32.34.34.82.54 1.32.54h1.38c.18 0 .35.08.48.22l.92 1.07c.28.3.6.51.96.58.37.08.75.04 1.1-.16l1.25-.62a.61.61 0 0 1 .52 0l1.25.62c.35.2.72.24 1.1.16.36-.08.69-.29.96-.58l.92-1.07a.61.61 0 0 1 .48-.22h1.38c.5 0 .98-.2 1.32-.54.34-.34.54-.82.54-1.32v-1.38c0-.18.08-.35.22-.48l1.07-.92c.3-.28.51-.6.58-.96.08-.37.04-.75-.16-1.1l-.62-1.25a.61.61 0 0 1 0-.52l.62-1.25c.2-.35.24-.72.16-1.1Z" fill="#2563EB" />
        <path d="m8.12 13.12-2.5-2.5 1.25-1.25 1.25 1.25 3.75-3.75 1.25 1.25-5 5Z" fill="white" />
    </svg>
)

export const ProjectCard = ({ project }: { project: Project }) => (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200">
        <div className="relative h-48 overflow-hidden">
            <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button className="absolute top-3 right-3 p-1.5 bg-background/20 hover:bg-background/40 backdrop-blur-md rounded-full text-white transition-colors">
                <Heart size={16} />
            </button>
        </div>

        <div className="self-stretch p-4 inline-flex flex-col justify-start items-start gap-4">
            <div className="self-stretch inline-flex justify-start items-start gap-1">
                <div className="pl-3 pr-1 py-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl outline outline-1 outline-offset-[-1px] outline-border flex justify-start items-center gap-[5px]">
                    <div className="justify-start text-foreground text-sm font-semibold leading-5">Mondial {project.mondial}</div>
                    <VerifiedBadge />
                </div>
                <div className="px-3 py-1 bg-orange-100 dark:bg-orange-950/30 rounded-[100px] flex justify-center items-center gap-2.5">
                    <div className="justify-start text-foreground text-sm font-semibold leading-5">Type: {project.type}</div>
                </div>
            </div>
            <div className="self-stretch inline-flex justify-between items-start">
                <div className="inline-flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-foreground text-base font-semibold leading-6">{project.title}</div>
                    <div className="justify-start text-muted-foreground text-sm leading-5">{project.date}</div>
                </div>
                <div className="flex justify-start items-center">
                    {project.team.slice(0, 3).map((avatar: string, i: number) => (
                        <img key={i} className="w-6 h-6 rounded-full shadow-[0px_2px_7px_0px_rgba(0,0,0,0.16)] border border-border" src={avatar} alt={`team member ${i + 1}`} />
                    ))}
                </div>
            </div>
            <div className="self-stretch inline-flex justify-between items-start">
                <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-foreground text-base font-semibold leading-6">Short Pitch</div>
                    <div className="self-stretch h-14 justify-start text-muted-foreground text-sm leading-5 overflow-hidden text-ellipsis line-clamp-2">{project.pitch}</div>
                </div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
                <div className="self-stretch inline-flex justify-start items-start gap-1.5">
                    <div className="justify-start text-foreground font-semibold text-sm leading-5">{project.funded} funded</div>
                </div>
                <div className="self-stretch h-1 relative">
                    <div className="w-full h-1 left-0 top-0 absolute bg-border rounded-[100px]"></div>
                </div>
                <div className="self-stretch inline-flex justify-start items-start gap-1.5 w-full">
                    <div className="justify-start"><span className="text-foreground text-sm font-semibold leading-5">Funding Goal </span><span className="text-foreground text-sm font-semibold leading-5">{project.goal}</span></div>
                    <div className="flex-1 text-right justify-start text-foreground text-sm font-semibold leading-5">{project.equity} equity offered</div>
                </div>
            </div>
            <button className="h-10 px-4 py-2 bg-primary rounded-xl flex justify-center items-center gap-2 w-full hover:bg-primary/90 transition-colors">
                <span className="justify-start text-primary-foreground text-sm font-semibold leading-5">View Details</span>
                <ArrowRight size={16} className="text-primary-foreground" />
            </button>
        </div>
    </div>
)
