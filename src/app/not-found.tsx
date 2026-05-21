import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="text-6xl font-bold text-foreground">404</div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
                    <p className="text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-colors no-underline"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
