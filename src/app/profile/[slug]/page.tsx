"use client";

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ProfileView } from '@/components/serviceprovider/profile/ProfileView';

export default function PublicProfilePage({ params }: { params?: { slug?: string } }) {
  const routeParams = useParams();
  const rawSlug = routeParams?.slug ?? params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug as string | undefined);

  return (
    <Suspense fallback={null}>
      <ProfileView mode="public" identifier={slug} />
    </Suspense>
  );
}
