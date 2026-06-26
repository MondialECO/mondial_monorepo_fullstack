'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-[#070707]">Something went wrong</h1>
                    <p className="text-sm text-[#5E5E5E]">
                        An unexpected error occurred. Please try again or contact support if the problem persists.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="flex-1 px-6 py-3 bg-[#3C61DD] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="flex-1 px-6 py-3 bg-white text-[#070707] border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
