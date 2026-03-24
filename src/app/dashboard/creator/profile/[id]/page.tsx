"use client"

import React from "react"
import { useParams } from "next/navigation"
import {
    CheckCircle2,
    MapPin,
    Mail,
    MoreVertical,
    ArrowRight,
    Plus,
    Heart
} from "lucide-react"

// --- MOCK DATA ---
const getProfileData = (id: string) => ({
    id,
    name: "Mathen Jefer",
    role: "Founder",
    location: "California, USA",
    verified: true,
    mondialScore: "90%",
    experience: "5 years 🚀✨",
    bio: "Challenges are tough, but each problem offers growth. Embrace struggles and let them fuel your determination!",
    vision: "Facing challenges can be tough, but remember that every problem is an opportunity for growth. Embrace the struggle, learn from it, and let it fuel your determination to succeed. Keep pushing forward, and you'll find the strength within you to overcome any obstacle!",
    tags: ["Finance", "SaaS", "E-commerce", "AI / Data"],
    prevProjects: [
        "Make a coffeehouse without large amount of cup",
        "Man in town without hat"
    ],
    projects: [
        {
            id: 1,
            title: "Launch a Mobile Pet Grooming Service",
            date: "22 January 2027",
            pitch: "A convenient, on-demand pet grooming service delivered right to your doorstep, ensuring a stress-free experience for pets and owners alike.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=1", "https://i.pravatar.cc/32?u=2"]
        },
        {
            id: 2,
            title: "Develop an AI-Powered Language Tutor",
            date: "15 February 2027",
            pitch: "An innovative language learning app that uses AI to provide personalized coaching, real-time feedback, and immersive conversation practice.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1546410531-bb4caa1b42fa?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=3", "https://i.pravatar.cc/32?u=4"]
        },
        {
            id: 3,
            title: "Eco-Friendly Packaging Solutions",
            date: "01 March 2027",
            pitch: "Sustainable, biodegradable packaging materials for e-commerce businesses to reduce their environmental footprint while maintaining product safety.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=5", "https://i.pravatar.cc/32?u=6"]
        },
        {
            id: 4,
            title: "Smart City Energy Grid",
            date: "12 April 2027",
            pitch: "A blockchain-enabled smart grid system that optimizes energy distribution and allows peer-to-peer renewable energy trading within urban areas.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=7", "https://i.pravatar.cc/32?u=8"]
        }
    ]
})

// --- SUB-COMPONENTS ---

const ProjectCard = ({ project }: { project: any }) => (
    <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200">
        <div className="relative h-48 overflow-hidden">
            <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white/95 rounded-md text-[10px] font-bold text-blue-600 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={10} /> Mondial {project.mondial}
                </span>
                <span className="px-2 py-1 bg-white/95 rounded-md text-[10px] font-bold text-gray-700 shadow-sm">
                    Type: {project.type}
                </span>
            </div>
            <button className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors">
                <Heart size={16} />
            </button>
        </div>

        <div className="p-6 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{project.date}</div>
                    <h3 className="text-gray-900 font-bold text-[15px] leading-tight group-hover:text-blue-600 transition-colors">
                        {project.title}
                    </h3>
                </div>
                <div className="flex -space-x-2">
                    {project.team.map((avatar: string, i: number) => (
                        <img key={i} src={avatar} alt="team" className="w-6 h-6 rounded-full border-2 border-card shadow-sm" />
                    ))}
                </div>
            </div>

            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 h-8">
                {project.pitch}
            </p>

            <div className="space-y-3 pt-2">
                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-900">Funded: <span className="text-blue-600">{project.funded}</span></span>
                        <span className="text-gray-400">Goal: {project.goal}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-0" />
                    </div>
                    <div className="text-gray-500 text-[11px] font-medium">
                        <span className="text-gray-900 font-bold">{project.equity}</span> Equity offered
                    </div>
                </div>

                <button className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                    View Details
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    </div>
)

export default function PublicProfilePage() {
    const { id } = useParams()
    const profile = getProfileData(id as string)

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans pb-12">
            <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Profile Info */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Main Profile Card */}
                        <div className="bg-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Cover Image */}
                            <div className="h-28 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                                <button className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-md text-white transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="px-6 pb-6 relative">
                                {/* Avatar */}
                                <div className="relative -top-12 mb-[-36px]">
                                    <div className="w-28 h-28 rounded-full border-4 border-card bg-gray-100 overflow-hidden shadow-md relative">
                                        <img src={`https://i.pravatar.cc/120?u=${profile.id}`} alt={profile.name} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 right-1 p-1 bg-card rounded-full shadow-md border border-gray-200">
                                            <CheckCircle2 size={18} className="text-blue-500 fill-blue-50" />
                                        </div>
                                    </div>
                                </div>

                                {/* Name & Role */}
                                <div className="space-y-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
                                        <div className="flex items-center gap-1.5 font-medium text-gray-500 text-[13px] mt-1">
                                            <span>{profile.role}</span>
                                            <span className="text-gray-300">|</span>
                                            <MapPin size={14} className="text-gray-400" />
                                            <span>{profile.location}</span>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100/50">
                                        <CheckCircle2 size={14} className="text-blue-600" />
                                        <span className="text-blue-700 text-sm font-bold tracking-tight">Mondial {profile.mondialScore}</span>
                                    </div>

                                    <p className="text-gray-600 text-[13px] leading-relaxed italic border-l-2 border-blue-100 pl-4 py-1">
                                        "{profile.bio}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Experience Card */}
                        <div className="bg-card rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Years of Experience</span>
                            <div className="text-gray-900 font-bold text-xl flex items-center gap-2">
                                {profile.experience}
                            </div>
                        </div>

                        {/* Background / Tags Card */}
                        <div className="bg-card rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Background</span>
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-muted text-gray-700 text-[11px] font-bold rounded-full border border-gray-200/50">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Previous Projects Card */}
                        <div className="bg-card rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Previous Projects</span>
                            <ul className="space-y-3">
                                {profile.prevProjects.map((p, i) => (
                                    <li key={i} className="text-[13px] font-semibold text-gray-700 flex items-start gap-3 group">
                                        <span className="w-5 h-5 bg-muted text-gray-500 rounded-md text-[10px] flex items-center justify-center font-bold">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1 leading-tight">{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Send Email Action */}
                        <div className="bg-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-500/10 flex items-center justify-between group cursor-pointer hover:bg-blue-700 transition-all active:scale-[0.98]">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                    <Mail size={20} />
                                </div>
                                <div className="text-[15px] font-bold text-white">Send an E-mail</div>
                            </div>
                            <ArrowRight size={18} className="text-white/60 group-hover:translate-x-1 transition-transform" />
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Vision & Projects */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* My Vision Card */}
                        <div className="bg-card rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                            <div className="flex items-center justify-between relative z-10">
                                <h2 className="text-xl font-bold text-gray-900">My Vision</h2>
                                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed sm:text-[15px] relative z-10">
                                {profile.vision}
                            </p>
                        </div>

                        {/* Current Projects Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-gray-900">Current Projects</h2>
                                    <span className="px-2 py-0.5 bg-muted text-gray-500 text-[10px] font-bold rounded-md">04</span>
                                </div>
                                <button className="text-blue-600 text-sm font-bold flex items-center gap-1.5 group hover:underline underline-offset-4">
                                    View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
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
