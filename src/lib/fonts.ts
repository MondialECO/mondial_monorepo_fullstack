import { Inter, Playfair_Display, DM_Sans } from 'next/font/google';

export const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
    preload: true,
});

export const playfairDisplay = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
    preload: true,
});

export const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-dm-sans',
    display: 'swap',
    preload: true,
});
