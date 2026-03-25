"use client"

import React from "react"
import { useParams } from "next/navigation"
import { MapPin, Plus } from "lucide-react"
import { getProfileData } from "./data"
import { ProjectCard } from "@/components/founder/ProjectCard"
import { ExperienceCard, TagsCard, PreviousProjectsCard } from "@/components/founder/profile/ProfileView"

export default function PublicProfilePage() {
    const { id } = useParams()
    const profile = getProfileData(id as string)

    return (
        <div className="min-h-screen bg-background flex flex-col pb-12">
            <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Profile Info */}
                    <div className="lg:col-span-4 space-y-2 bg-card rounded-2xl border border-border">

                        {/* Main Profile Card */}
                        <div className="overflow-hidden rounded-2xl">
                            {/* Cover Image */}
                            <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
                                <img src="https://unsplash.com/photos/turned-on-flat-screen-television-5Xwaj9gaR0g" alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
                                <button className="absolute top-3 right-3 p-1.5 bg-background/20 hover:bg-background/30 backdrop-blur-md rounded-md text-foreground transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="px-6 pb-6 relative flex flex-col items-center">
                                {/* Avatar */}
                                <div className="relative -top-12 mb-[-36px] flex justify-center">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full border-2 border-background bg-muted overflow-hidden shadow-md">
                                            <img src={`https://i.pravatar.cc/120?u=${profile.id}`} alt={profile.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 z-10 bg-background rounded-full">
                                            <svg width="20" height="20" aria-label="verify - 20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 drop-shadow-sm">
                                                <path d="M19.58 7.95a1.85 1.85 0 0 0-.58-.96l-1.07-.92a.61.61 0 0 1-.22-.48v-1.38a1.86 1.86 0 0 0-.54-1.32 1.86 1.86 0 0 0-1.32-.54h-1.38a.61.61 0 0 1-.48-.22l-.92-1.07a1.86 1.86 0 0 0-1.41-.65 1.86 1.86 0 0 0-1.35.63l-1.25.62a.61.61 0 0 1-.52 0l-1.25-.62a1.86 1.86 0 0 0-1.1-.16 1.86 1.86 0 0 0-.96.58l-.92 1.07a.61.61 0 0 1-.48.22H3.14c-.5 0-.98.2-1.32.54A1.86 1.86 0 0 0 1.25 4.2v1.38c0 .18-.08.35-.22.48l-1.07.92a1.86 1.86 0 0 0-.58.96c-.08.37-.04.75.16 1.1l.62 1.25a.61.61 0 0 1 0 .52l-.62 1.25a1.86 1.86 0 0 0-.16 1.1c.08.36.29.69.58.96l1.07.92c.14.13.22.3.22.48v1.38c0 .5.2.98.54 1.32.34.34.82.54 1.32.54h1.38c.18 0 .35.08.48.22l.92 1.07c.28.3.6.51.96.58.37.08.75.04 1.1-.16l1.25-.62a.61.61 0 0 1 .52 0l1.25.62c.35.2.72.24 1.1.16.36-.08.69-.29.96-.58l.92-1.07a.61.61 0 0 1 .48-.22h1.38c.5 0 .98-.2 1.32-.54.34-.34.54-.82.54-1.32v-1.38c0-.18.08-.35.22-.48l1.07-.92c.3-.28.51-.6.58-.96.08-.37.04-.75-.16-1.1l-.62-1.25a.61.61 0 0 1 0-.52l.62-1.25c.2-.35.24-.72.16-1.1Z" fill="#2563EB" />
                                                <path d="m8.12 13.12-2.5-2.5 1.25-1.25 1.25 1.25 3.75-3.75 1.25 1.25-5 5Z" fill="white" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Name & Role */}
                                <div className="space-y-4 flex flex-col items-center text-center">
                                    <div>
                                        <h1 className="text-2xl font-bold text-foreground leading-tight">{profile.name}</h1>
                                        <div className="flex items-center justify-center gap-1.5 font-semibold text-muted-foreground text-[13px] mt-1">
                                            <span>{profile.role}</span>
                                            <span className="text-border">|</span>
                                            <MapPin size={14} className="text-muted-foreground" />
                                            <span>{profile.location}</span>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-border">
                                        <span className="text-primary text-sm font-bold tracking-tight">Mondial {profile.mondialScore}</span>
                                        <svg width="20" height="20" aria-label="verify - 20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                            <path d="M19.58 7.95a1.85 1.85 0 0 0-.58-.96l-1.07-.92a.61.61 0 0 1-.22-.48v-1.38a1.86 1.86 0 0 0-.54-1.32 1.86 1.86 0 0 0-1.32-.54h-1.38a.61.61 0 0 1-.48-.22l-.92-1.07a1.86 1.86 0 0 0-1.41-.65 1.86 1.86 0 0 0-1.35.63l-1.25.62a.61.61 0 0 1-.52 0l-1.25-.62a1.86 1.86 0 0 0-1.1-.16 1.86 1.86 0 0 0-.96.58l-.92 1.07a.61.61 0 0 1-.48.22H3.14c-.5 0-.98.2-1.32.54A1.86 1.86 0 0 0 1.25 4.2v1.38c0 .18-.08.35-.22.48l-1.07.92a1.86 1.86 0 0 0-.58.96c-.08.37-.04.75.16 1.1l.62 1.25a.61.61 0 0 1 0 .52l-.62 1.25a1.86 1.86 0 0 0-.16 1.1c.08.36.29.69.58.96l1.07.92c.14.13.22.3.22.48v1.38c0 .5.2.98.54 1.32.34.34.82.54 1.32.54h1.38c.18 0 .35.08.48.22l.92 1.07c.28.3.6.51.96.58.37.08.75.04 1.1-.16l1.25-.62a.61.61 0 0 1 .52 0l1.25.62c.35.2.72.24 1.1.16.36-.08.69-.29.96-.58l.92-1.07a.61.61 0 0 1 .48-.22h1.38c.5 0 .98-.2 1.32-.54.34-.34.54-.82.54-1.32v-1.38c0-.18.08-.35.22-.48l1.07-.92c.3-.28.51-.6.58-.96.08-.37.04-.75-.16-1.1l-.62-1.25a.61.61 0 0 1 0-.52l.62-1.25c.2-.35.24-.72.16-1.1Z" fill="#2563EB" />
                                            <path d="m8.12 13.12-2.5-2.5 1.25-1.25 1.25 1.25 3.75-3.75 1.25 1.25-5 5Z" fill="white" />
                                        </svg>
                                    </div>

                                    <p className="self-stretch text-center justify-start text-muted-foreground text-sm">
                                        "{profile.bio}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Extracted Side Cards */}
                        <ExperienceCard experience={profile.experience} />
                        <TagsCard tags={profile.tags} />
                        <PreviousProjectsCard prevProjects={profile.prevProjects} />
                    </div>

                    {/* RIGHT COLUMN: Vision & Projects */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* My Vision Card */}
                        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-950/20 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                            <div className="flex items-center justify-between relative z-10">
                                <h2 className="text-base font-semibold text-foreground">My Vision</h2>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed relative z-10">
                                {profile.vision}
                            </p>
                        </div>

                        {/* Current Projects Section */}
                        <div className="bg-muted/50 rounded-2xl border border-border shadow-sm p-3 sm:p-4 space-y-3 relative overflow-hidden group">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-base font-semibold text-foreground">Current Projects</h2>
                                    <span className="text-foreground text-base font-semibold rounded-md">{profile.projects.length}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {profile.projects.map(project => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    )
}
