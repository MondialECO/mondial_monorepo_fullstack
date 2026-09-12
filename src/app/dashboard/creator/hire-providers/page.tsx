import { redirect } from 'next/navigation';

export default async function HireProvidersRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp) {
    for (const [key, val] of Object.entries(sp)) {
      if (typeof val === 'string') {
        qs.set(key, val);
      } else if (Array.isArray(val)) {
        val.forEach((v) => qs.append(key, v));
      }
    }
  }
  const queryString = qs.toString();
  redirect(`/marketplace/services${queryString ? `?${queryString}` : ''}`);
}
