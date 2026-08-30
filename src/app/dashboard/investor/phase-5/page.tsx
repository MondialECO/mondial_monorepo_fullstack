import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Deal Discovery | Mondial',
  description: 'Browse and discover investment opportunities',
};

export default function Phase5Page() {
  redirect('/dashboard/investor/discovery');
}
