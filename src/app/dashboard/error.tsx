'use client';

import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { ROLE_DASHBOARD_ROUTES, UserRole } from '@/lib/roles';

function getDashboardRoute(userRole: string): string {
  return ROLE_DASHBOARD_ROUTES[userRole as UserRole];
}

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { user } = useAuth();
    const router = useRouter();

    // If user is in phase 0, redirect to phase-1 instead of showing error
    const onboardingPhase = user?.onboardingPhase ?? 0;
    if (onboardingPhase === 0 && user?.role) {
        setTimeout(() => {
            const dashboardRoute = getDashboardRoute(user.role);
            router.push(`${dashboardRoute}/phase-1`);
        }, 100);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {onboardingPhase === 0 ? 'Identity Verification Required' : 'Dashboard Error'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {onboardingPhase === 0
                            ? 'Please complete your identity verification to continue.'
                            : 'An error occurred while loading the dashboard. Please try again.'}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {onboardingPhase === 0 && user ? (
                        <button
                            onClick={() => router.push(`${getDashboardRoute(user.role)}/phase-1`)}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Go to Identity Verification
                        </button>
                    ) : (
                        <button
                            onClick={reset}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Try again
                        </button>
                    )}
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
