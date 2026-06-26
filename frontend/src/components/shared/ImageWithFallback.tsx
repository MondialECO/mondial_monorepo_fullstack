'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string;
    width?: number;
    height?: number;
    fallbackType?: 'avatar' | 'placeholder';
    showBorder?: boolean;
    priority?: boolean;
}

/**
 * Image component with built-in fallback to placeholder
 * Optimized using next/image for format conversion, lazy loading, and sizing
 */
export function ImageWithFallback({
    src = '',
    alt = '',
    width = 200,
    height = 200,
    fallbackType = 'placeholder',
    showBorder = false,
    priority = false,
    className = '',
}: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false);

    // Fallback SVG placeholders
    const avatarPlaceholder = (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <circle cx="20" cy="20" r="20" fill="#E8E8E8" />
            <circle cx="20" cy="13" r="5" fill="#999" />
            <path
                d="M 10 28 Q 20 22 30 28"
                stroke="#999"
                strokeWidth="2"
                fill="none"
            />
        </svg>
    );

    const genericPlaceholder = (
        <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <rect width="200" height="200" fill="#F0F0F0" />
            <circle cx="100" cy="70" r="25" fill="#D0D0D0" />
            <path
                d="M 50 150 Q 100 120 150 150"
                stroke="#D0D0D0"
                strokeWidth="3"
                fill="none"
            />
        </svg>
    );

    if (hasError || !src) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 ${showBorder ? 'border border-gray-300' : ''
                    } ${className}`}
                title={alt || 'Image failed to load'}
                style={{ width, height }}
            >
                {fallbackType === 'avatar' ? avatarPlaceholder : genericPlaceholder}
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            quality={75}
            priority={priority}
            onError={() => setHasError(true)}
            className={`${showBorder ? 'border border-gray-300' : ''} ${className}`}
        />
    );
}
