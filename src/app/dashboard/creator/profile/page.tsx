import { redirect } from 'next/navigation';

export default function CreatorProfileRedirect() {
  redirect('/dashboard/profile');
}