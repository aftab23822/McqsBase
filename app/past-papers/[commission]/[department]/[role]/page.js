// Server entry for a past-paper role listing. The UI stays client-side, but crawlers now get
// a real title and canonical, and a 404 (not a 200 spinner) when no category backs the path.
import { cache } from 'react';
import { notFound } from 'next/navigation';
import PastPaperRoleClient from '@/components/PastPapers/PastPaperRoleClient';
import { pastPaperListingMetadata } from '@/components/PastPapers/listingMetadata';
import { pastPaperListingExists } from '@/lib/services/pastPaperQuestion';

const listingExists = cache((key) => pastPaperListingExists(key.split('/')));

async function segmentsOf(params) {
  const { commission, department, role } = await params;
  return [commission, department, role];
}

export async function generateMetadata({ params }) {
  const segments = await segmentsOf(params);
  if (!(await listingExists(segments.join('/')))) notFound();
  return pastPaperListingMetadata(segments);
}

export default async function PastPaperRolePage({ params }) {
  const segments = await segmentsOf(params);
  if (!(await listingExists(segments.join('/')))) notFound();
  return <PastPaperRoleClient />;
}
