import { Instrument_Sans, Playfair_Display } from 'next/font/google';

export const instrumentSans = Instrument_Sans({
    subsets: ['latin'],
    variable: '--font-instrument',
    display: 'swap',
    preload: true,
});

export const playfairDisplay = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
    preload: true,
});