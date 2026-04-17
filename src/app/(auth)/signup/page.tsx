"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { registerApi, RegisterModel } from "../../../../service/auth/auth"
import { UserRole } from "@/lib/roles"
import EmailVerificationLayout from "@/components/auth/EmailVerificationLayout"
import EmailDisplay from "@/components/auth/EmailDisplay"
import { Mail, ArrowRight } from "lucide-react"

type SignupStep = "form" | "confirmation" | "error"

export default function Signup() {
    const router = useRouter()

    // Form state
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("creator")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [step, setStep] = useState<SignupStep>("form")
    const [registeredEmail, setRegisteredEmail] = useState("")

    // Normalize role string to proper UserRole enum
    const normalizeRole = (roleStr: string): string => {
        const normalized = roleStr.toLowerCase().trim()
        if (normalized === "creator") return "Creator"
        if (normalized === "investor") return "Investor"
        if (normalized === "entrepreneur") return "Entrepreneur"
        if (normalized === "serviceprovider" || normalized === "service provider") return "ServiceProvider"
        if (normalized === "admin") return "Admin"
        return "Creator" // Default fallback
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMsg("")

        try {
            const model: RegisterModel = {
                Name: fullName,
                Email: email,
                Password: password,
                User: role
            }

            const response = await registerApi(model)

            // Check if backend returns token in signup response
            if (response?.token && response?.user) {
                // ✅ Auto-login user after successful signup
                // This ensures token and user are persisted through AuthProvider's state management
                const token = response.token
                const userRole = normalizeRole(response.user.roles?.[0] || role)

                // Store directly in localStorage (AuthProvider will hydrate on next render)
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify({
                    id: response.user.id,
                    name: response.user.name,
                    role: userRole
                }))

                // Redirect to correct role-based dashboard
                const roleRoutes: Record<string, string> = {
                    "creator": "/dashboard/creator",
                    "investor": "/dashboard/investor",
                    "Creator": "/dashboard/creator",
                    "Investor": "/dashboard/investor",
                    "Admin": "/dashboard/admin",
                    "Entrepreneur": "/dashboard/entrepreneur",
                    "ServiceProvider": "/dashboard/serviceprovider",
                }

                const dashboardRoute = roleRoutes[userRole] || "/dashboard/creator"
                router.push(dashboardRoute)
            } else {
                // If signup doesn't return token, show email confirmation screen
                setRegisteredEmail(email)
                setStep("confirmation")
                // Auto-redirect after 5 seconds to confirm-email page
                setTimeout(() => {
                    router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
                }, 5000)
            }
        } catch (err: any) {
            console.error(err)
            setErrorMsg(err?.response?.data?.message || "Registration failed")
            setStep("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleManualRedirect = () => {
        router.push(`/confirm-email?email=${encodeURIComponent(registeredEmail)}`)
    }

    if (step === "confirmation") {
        return (
            <EmailVerificationLayout>
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Check Your Email
                        </h1>
                        <p className="text-gray-600">
                            We've sent a confirmation link to verify your account.
                        </p>
                    </div>

                    <EmailDisplay
                        email={registeredEmail}
                        label="Confirmation email sent to:"
                    />

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-lg">📧</span> What's next?
                        </h3>
                        <ol className="space-y-2 text-sm text-gray-700">
                            <li className="flex gap-3">
                                <span className="font-semibold text-blue-600 flex-shrink-0">1.</span>
                                <span>Check your email inbox for the confirmation link</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-semibold text-blue-600 flex-shrink-0">2.</span>
                                <span>Click the link to verify your email address</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-semibold text-blue-600 flex-shrink-0">3.</span>
                                <span>Return and log in to your account</span>
                            </li>
                        </ol>
                        <p className="text-xs text-gray-600 mt-3">
                            💡 Tip: Check your spam or promotions folder if you don't see the email.
                        </p>
                    </div>

                    <Button
                        onClick={handleManualRedirect}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        Go to Verification
                        <ArrowRight className="w-4 h-4" />
                    </Button>

                    <p className="text-xs text-gray-500">
                        Redirecting automatically in a moment...
                    </p>

                    <div className="pt-2">
                        <Link
                            href="/login"
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Already verified? Log in here
                        </Link>
                    </div>
                </div>
            </EmailVerificationLayout>
        )
    }

    if (step === "error") {
        return (
            <EmailVerificationLayout>
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl">⚠️</span>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Registration Failed
                        </h1>
                        <p className="text-gray-600">{errorMsg}</p>
                    </div>

                    <Button
                        onClick={() => {
                            setStep("form")
                            setErrorMsg("")
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
                    >
                        Try Again
                    </Button>

                    <Link
                        href="/login"
                        className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        Back to Login
                    </Link>
                </div>
            </EmailVerificationLayout>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create Account</h1>
                    <p className="text-center text-gray-600 mb-6">Join our community today</p>

                    {errorMsg && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition"
                            >
                                <option value="creator">Creator (I have an idea)</option>
                                <option value="investor">Investor (I want to invest)</option>
                            </select>
                        </div>

                        <Button type="submit" className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:from-gray-400 disabled:to-gray-500" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? "Creating Account..." : "Sign Up"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">Log in</Link>
                    </div>
                </div>
            </div>
        </>
    )
}
