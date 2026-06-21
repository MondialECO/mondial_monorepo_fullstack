"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreatorOnboardingClient() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleStartVerification = () => {
        // Mock action to proceed with verification
        setIsSubmitting(true)
        localStorage.setItem("creator_verification_skipped_at", Date.now().toString())
        setTimeout(() => {
            router.push("/dashboard/creator")
        }, 1000)
    }

    return (
        <div className="min-h-screen text-slate-800 antialiased flex flex-col items-center pt-8 bg-[#f3f4f6] font-sans">
            <style jsx>{`
                .progress-ring__circle {
                    transition: stroke-dashoffset 0.35s;
                    transform: rotate(-90deg);
                    transform-origin: 50% 50%;
                }
                ::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            
            {/* Header */}
            <header className="w-full max-w-5xl px-8 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-md shadow-sm"></div>
                <span className="font-bold text-lg tracking-tight">Mondial</span>
            </header>

            {/* Main Container */}
            <main className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px] border border-gray-100">
                {/* Left Sidebar */}
                <aside className="w-full md:w-[350px] bg-white border-r border-gray-100 p-10 flex flex-col items-center text-center shrink-0 justify-center">
                    {/* Progress Ring */}
                    <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 120 120">
                            {/* Background circle */}
                            <circle cx="60" cy="60" fill="none" r="54" stroke="#e2e8f0" strokeWidth="12"></circle>
                            {/* Progress circle (80%) */}
                            <circle className="progress-ring__circle" cx="60" cy="60" fill="none" r="54" stroke="#3b82f6" strokeDasharray="339.292" strokeDashoffset="67.8584" strokeLinecap="round" strokeWidth="12"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold text-slate-800">80%</span>
                        </div>
                    </div>
                    {/* Phase Info */}
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Phase 1 of 6</h2>
                    <p className="text-blue-600 font-medium text-sm mb-3">Active: Universal Identity Gate</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-8 max-w-[220px]">
                        Complete each phase to unlock the next step in your creator journey.
                    </p>
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvpz10MayC1JF-cl9CTfujIdztjF-7JfIxeV4zzMxY_w3ToxyLfh9unI_SDUK4Pnhnp_ww1vBvWzvYpPP3P4pqMijb2YG3o3Osx4B-GPLnT84X8cE5k8ZVaNbom7BI7QA5_O6he2TkDvvWEhpqyTlmEsjjvcvQgE_baRMsNmn2mZWCRFtWsBuclLWXUxVrQTNrWgs0eIRozJXQasHBbz_kVnOG-6ibZUWuQr9YJDTnGV1rmOSNkr-9DnkAK8nUPHDse0MtawwdQw" alt="3D illustration of a man working at a desk" className="w-full max-w-[300px] h-auto mb-8 rounded-xl shadow-sm" />
                    {/* Illustration */}
                    <div className="w-full relative h-[10px] flex items-end justify-center"></div>
                </aside>

                {/* Right Content Area */}
                <section className="flex-1 p-10 md:pl-12 flex flex-col bg-gray-50/30">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">Complete your profile</h1>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
                            You must complete Universal Identity Gate before accessing your Creator dashboard. 
                            This ensures a secure and verified ecosystem.
                        </p>
                    </div>

                    {/* Steps Accordion */}
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                        {/* Phase 1 (Expanded) */}
                        <div className="border border-blue-200 bg-white rounded-xl overflow-hidden shadow-sm shadow-blue-100/50">
                            {/* Accordion Header */}
                            <div className="p-5 flex items-start gap-4">
                                <div className="mt-1 shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-base">Phase 1: Profile Verification</h3>
                                    <p className="text-gray-500 text-sm mt-0.5">I want to build a new project</p>
                                </div>
                                <button className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                                    <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                </button>
                            </div>
                            {/* Accordion Body */}
                            <div className="px-5 pb-6 pt-2 pl-14 border-t border-gray-100">
                                {/* Mandatory Steps */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h4 className="font-semibold text-slate-800 text-sm">Mandatory Steps</h4>
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">Required</span>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path></svg>
                                            <span className="text-gray-400 line-through">Role selected: <strong className="font-semibold">Creator</strong></span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path></svg>
                                            <span className="text-gray-500">Identity Document</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path></svg>
                                            <span className="text-gray-500">Facial verification</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path></svg>
                                            <span className="text-gray-500">Phone verification</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0"></div>
                                            <span className="text-slate-700">Email verification</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0"></div>
                                            <span className="text-slate-700">Final verification approval</span>
                                        </li>
                                    </ul>
                                </div>
                                {/* Optional Steps */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h4 className="font-semibold text-slate-800 text-sm">Optional Steps</h4>
                                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">Optional</span>
                                    </div>
                                    <ul className="space-y-2.5">
                                        <li className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path></svg>
                                            <span className="text-gray-500">Portfolio Link</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd"></path></svg>
                                            <span className="text-gray-500">Social Profiles</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Phase 2 */}
                        <div className="border border-gray-200 bg-white rounded-xl p-5 flex items-center gap-4 opacity-75">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center bg-gray-50"></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-sm">Phase 2: Project Identity &amp; Branding</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Complete Phase 1 to unlock this phase.</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </div>

                        {/* Phase 3 */}
                        <div className="border border-gray-200 bg-white rounded-xl p-5 flex items-center gap-4 opacity-75">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center bg-gray-50"></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-sm">Phase 3: Project Intelligence &amp; AI Tools</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Complete Phase 2 to unlock this phase.</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </div>

                        {/* Phase 4 */}
                        <div className="border border-gray-200 bg-white rounded-xl p-5 flex items-center gap-4 opacity-75">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center bg-gray-50"></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-sm">Phase 4: Offer &amp; Resource Setup</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Complete Phase 3 to unlock this phase.</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </div>

                        {/* Phase 5 */}
                        <div className="border border-gray-200 bg-white rounded-xl p-5 flex items-center gap-4 opacity-75">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center bg-gray-50"></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-sm">Phase 5: The Crossroads</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Complete Phase 4 to unlock this phase.</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </div>

                        {/* Phase 6 */}
                        <div className="border border-gray-200 bg-white rounded-xl p-5 flex items-center gap-4 opacity-75">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0 flex items-center justify-center bg-gray-50"></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 text-sm">Phase 6: Verified Entrepreneur Level Up</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Complete Phase 5 to unlock this phase.</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </div>
                    </div>

                    {/* Action Button Container */}
                    <div className="mt-8 flex justify-end shrink-0 pt-4 border-t border-gray-100 md:border-none md:pt-0 gap-3">
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
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-medium py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-sm"
                        >
                            {isSubmitting ? "Processing..." : "Start verification"}
                            {!isSubmitting && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                            )}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}
