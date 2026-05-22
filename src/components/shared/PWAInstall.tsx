'use client';

import { useEffect } from 'react';

export function PWAInstall() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => void registration.unregister());
                });
            }
            return;
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            console.log('PWA install available');
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
        });
    }, []);

    return null;
}
