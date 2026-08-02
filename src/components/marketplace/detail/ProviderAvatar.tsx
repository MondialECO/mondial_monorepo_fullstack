'use client';

import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';

/** Shared avatar with initial fallback. Never renders a broken image. */
export function ProviderAvatar({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className: string;
}) {
  const resolved = url ? resolveProviderMediaUrl(url) : null;
  if (resolved) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved} alt={name} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
