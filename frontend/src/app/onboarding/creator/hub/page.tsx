import { Metadata } from "next"
import CreatorOnboardingClient from "../CreatorOnboardingClient"

export const metadata: Metadata = {
    title: "Creator Setup - Mondial",
    description: "Complete your Mondial creator profile",
}

export default function CreatorOnboardingPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#F9F9FA] to-[#FFFFFF] flex justify-center py-10 px-4 sm:px-6">
            <CreatorOnboardingClient />
        </main>
    )
}
