"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

export default function CreatorOnboardingClient() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPhase1Expanded, setIsPhase1Expanded] = useState(true)

    const handleStartVerification = () => {
        setIsSubmitting(true)
        localStorage.setItem("creator_verification_skipped_at", Date.now().toString())
        setTimeout(() => {
            router.push("/dashboard/creator")
        }, 1000)
    }

    return (
        <div className="min-h-screen w-full bg-[#EAEAEA] flex flex-col text-slate-800 antialiased font-sans">
            <style jsx>{`
                .progress-ring__circle {
                    transition: stroke-dashoffset 0.35s;
                    transform: rotate(-90deg);
                    transform-origin: 50% 50%;
                }
                .figma-shadow {
                    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
                }
                ::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            
            {/* White Top Header Bar */}
            <header className="w-full bg-white h-16 border-b border-gray-100 px-8 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-[#3C61DD] rounded-md shadow-sm"></div>
                <span className="font-bold text-lg tracking-tight text-[#070707]">Mondial</span>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                {/* White Main Card Container */}
                <main className="w-full max-w-5xl bg-white rounded-[24px] figma-shadow overflow-hidden flex flex-col md:flex-row min-h-[750px] border border-gray-200/50">
                    
                    {/* Left Column (Progress Panel) */}
                    <aside className="w-full md:w-[350px] bg-white border-r border-gray-200/80 p-8 flex flex-col items-center shrink-0 justify-between">
                        <div className="w-full flex flex-col items-center mt-6">
                            {/* Circular Progress Ring */}
                            <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                                <svg className="w-full h-full" viewBox="0 0 120 120">
                                    {/* Background circle */}
                                    <circle cx="60" cy="60" fill="none" r="50" stroke="#EAEAEA" strokeWidth="8"></circle>
                                    {/* Progress circle (80%) */}
                                    <circle className="progress-ring__circle" cx="60" cy="60" fill="none" r="50" stroke="#3C61DD" strokeDasharray="314.159" strokeDashoffset="62.8318" strokeLinecap="round" strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-3xl font-bold text-[#070707]">80%</span>
                                </div>
                            </div>
                            
                            {/* Phase Info */}
                            <h2 className="text-xl font-bold text-[#070707] mb-1.5">Phase 1 of 6</h2>
                            <p className="text-[#3C61DD] font-semibold text-sm mb-3">Active: Universal Identity Gate</p>
                            <p className="text-[#606060] text-xs text-center leading-relaxed max-w-[220px]">
                                Complete each phase to unlock the next step in your creator journey.
                            </p>
                        </div>

                        {/* 3D Illustration of man working at desk */}
                        <div className="w-full flex justify-center mt-6 mb-4">
                            <img 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvpz10MayC1JF-cl9CTfujIdztjF-7JfIxeV4zzMxY_w3ToxyLfh9unI_SDUK4Pnhnp_ww1vBvWzvYpPP3P4pqMijb2YG3o3Osx4B-GPLnT84X8cE5k8ZVaNbom7BI7QA5_O6he2TkDvvWEhpqyTlmEsjjvcvQgE_baRMsNmn2mZWCRFtWsBuclLWXUxVrQTNrWgs0eIRozJXQasHBbz_kVnOG-6ibZUWuQr9YJDTnGV1rmOSNkr-9DnkAK8nUPHDse0MtawwdQw" 
                                alt="3D illustration of a man working at a desk" 
                                className="w-full max-w-[240px] h-auto object-contain" 
                            />
                        </div>
                    </aside>

                    {/* Right Column (Accordion Panel) */}
                    <section className="flex-1 p-8 md:p-10 flex flex-col bg-white">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-[#070707] mb-2">Complete your profile</h1>
                            <p className="text-[#606060] text-xs leading-relaxed max-w-xl">
                                You must complete Universal Identity Gate before accessing your Creator dashboard. 
                                This ensures a secure and verified ecosystem.
                            </p>
                        </div>

                        {/* Accordion Steps List */}
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                            
                            {/* Phase 1: Expanded */}
                            <div className="border border-blue-100 bg-white rounded-xl overflow-hidden shadow-sm">
                                {/* Header */}
                                <div 
                                    onClick={() => setIsPhase1Expanded(!isPhase1Expanded)}
                                    className="p-4 flex items-center gap-3 cursor-pointer select-none"
                                >
                                    {/* Active Radio Button Dot */}
                                    <div className="w-5 h-5 rounded-full border-2 border-[#3C61DD] flex items-center justify-center shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#3C61DD]"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[#070707] text-sm">Phase 1: Profile Verification</h3>
                                        <p className="text-[#606060] text-[11px]">I want to build a new project</p>
                                    </div>
                                    <svg className={`w-4 h-4 text-[#606060] transition-transform duration-200 ${isPhase1Expanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>

                                {/* Body */}
                                {isPhase1Expanded && (
                                    <div className="px-4 pb-5 pt-1 pl-12 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
                                        {/* Mandatory Steps (Required) */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <span className="font-bold text-[#3E3E3E] text-[11px] uppercase tracking-wider">Mandatory Steps</span>
                                                <span className="bg-[#3C61DD] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Required</span>
                                            </div>
                                            <ul className="space-y-2">
                                                <li className="flex items-center gap-2.5 text-xs text-[#606060]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span className="line-through decoration-[#3C61DD]">Role selected: <strong className="font-semibold text-[#3E3E3E]">Creator</strong></span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Identity Document</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Facial verification</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Phone verification</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#606060]">
                                                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0"></div>
                                                    <span>Email verification</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#606060]">
                                                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0"></div>
                                                    <span>Final verification approval</span>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Mandatory Steps (Optional) */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <span className="font-bold text-[#3E3E3E] text-[11px] uppercase tracking-wider">Mandatory Steps</span>
                                                <span className="bg-[#606060]/10 text-[#606060] text-[9px] font-bold px-1.5 py-0.5 rounded-full">Optional</span>
                                            </div>
                                            <ul className="space-y-2">
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Email V</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Identity Document</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Facial verification</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#3E3E3E]">
                                                    <div className="w-4 h-4 rounded-full bg-[#3C61DD] flex items-center justify-center shrink-0">
                                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                                    </div>
                                                    <span>Phone verification</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#606060]">
                                                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0"></div>
                                                    <span>Email verification</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs text-[#606060]">
                                                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0"></div>
                                                    <span>Final verification approval</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Phase 2: Locked */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#070707] text-sm">Phase 2: Project Identity &amp; Branding</h3>
                                    <p className="text-[#606060] text-[10px]">Complete Phase 1 to unlock this phase.</p>
                                </div>
                                <svg className="w-4 h-4 text-[#606060]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>

                            {/* Phase 3: Locked */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#070707] text-sm">Phase 3: Project Intelligence &amp; AI Tools</h3>
                                    <p className="text-[#606060] text-[10px]">Complete Phase 2 to unlock this phase.</p>
                                </div>
                                <svg className="w-4 h-4 text-[#606060]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>

                            {/* Phase 4: Locked */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#070707] text-sm">Phase 4: Offer &amp; Resource Setup</h3>
                                    <p className="text-[#606060] text-[10px]">Complete Phase 3 to unlock this phase.</p>
                                </div>
                                <svg className="w-4 h-4 text-[#606060]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>

                            {/* Phase 5: Locked */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#070707] text-sm">Phase 5: The Crossroads</h3>
                                    <p className="text-[#606060] text-[10px]">Complete Phase 4 to unlock this phase.</p>
                                </div>
                                <svg className="w-4 h-4 text-[#606060]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>

                            {/* Phase 6: Locked */}
                            <div className="border border-gray-100 bg-white rounded-xl p-4 flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0"></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-[#070707] text-sm">Phase 6: Verified Entrepreneur Level Up</h3>
                                    <p className="text-[#606060] text-[10px]">Complete Phase 5 to unlock this phase.</p>
                                </div>
                                <svg className="w-4 h-4 text-[#606060]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>

                        </div>

                        {/* Start Verification Button */}
                        <div className="mt-6 flex justify-end shrink-0 pt-3 border-t border-gray-100 gap-3">
                            <button
                                onClick={() => {
                                    localStorage.setItem("creator_verification_skipped_at", Date.now().toString());
                                    router.push("/dashboard/creator");
                                }}
                                className="text-gray-500 hover:text-gray-700 font-semibold py-2 px-4 rounded-lg cursor-pointer text-sm transition-colors"
                            >
                                Skip for now
                            </button>
                            <button 
                                onClick={handleStartVerification}
                                disabled={isSubmitting}
                                className="bg-[#3C61DD] hover:bg-[#3C61DD]/90 disabled:opacity-75 text-white font-semibold py-2 px-5 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm cursor-pointer text-sm"
                            >
                                {isSubmitting ? "Processing..." : "Start verification →"}
                            </button>
                        </div>

                    </section>
                </main>
            </div>
        </div>
    )
}
