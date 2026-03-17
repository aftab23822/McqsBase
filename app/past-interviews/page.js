import { redirect } from 'next/navigation';

export default function PastInterviewsPage() {
  // Canonical root for Past Interviews should show Sindh Government Junior Clerk listing
  redirect('/past-interviews/sindh-government/junior-clerk');
}
