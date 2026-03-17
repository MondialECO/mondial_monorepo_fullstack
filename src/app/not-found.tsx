import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="text-6xl font-bold text-[#070707]">404</div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-[#070707]">Page not found</h1>
                    <p className="text-sm text-[#5E5E5E]">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-[#3C61DD] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
