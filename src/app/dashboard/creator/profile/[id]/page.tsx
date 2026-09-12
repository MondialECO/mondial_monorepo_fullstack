import { redirect } from 'next/navigation';

export default async function CreatorProfileIdRedirect({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params;
  if (resolvedParams?.id) {
    redirect(`/profile/${resolvedParams.id}`);
  }
  redirect('/dashboard/profile');
}
