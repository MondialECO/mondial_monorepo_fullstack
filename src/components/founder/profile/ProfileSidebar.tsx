import React from "react"
import { Profile } from "@/types/creator/publicProfile"

export const ExperienceCard = ({ experience }: { experience: string }) => (
    <div className="border border-border rounded-2xl p-6 space-y-3 bg-card">
        <span className="self-stretch justify-start text-foreground text-base font-semibold leading-6">Years of Experience</span>
        <div className="self-stretch p-2 justify-start text-muted-foreground text-sm">
            {experience}
        </div>
    </div>
)

export const TagsCard = ({ tags }: { tags: string[] }) => (
    <div className="border border-border rounded-2xl p-6 space-y-4 bg-card">
        <div className="self-stretch justify-start text-foreground text-base font-semibold leading-6">Experience & Background</div>
        <div className="self-stretch inline-flex justify-start items-start gap-2 flex-wrap content-start">
            {tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-muted text-foreground text-sm rounded-full border border-border">
                    {tag}
                </span>
            ))}
        </div>
    </div>
)

export const PreviousProjectsCard = ({ prevProjects }: { prevProjects: string[] }) => (
    <div className="border border-border rounded-2xl p-6 space-y-4 bg-card">
        <div className="self-stretch justify-start text-foreground text-base font-semibold leading-6">Previous Projects</div>
        <ul className="space-y-3">
            {prevProjects.map((p, i) => (
                <li key={i} className="text-foreground flex items-start gap-3 group">
                    <span className="w-5 h-5 text-muted-foreground rounded-md text-sm flex items-center justify-center">
                        {i + 1}
                    </span>
                    <span className="flex-1 leading-tight text-sm dark:text-muted-foreground">{p}</span>
                </li>
            ))}
        </ul>
    </div>
)
