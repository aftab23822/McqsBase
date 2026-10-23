import { cache } from 'react';
import { getMcqListing } from './mcqListing';
import { SITE_URL } from '../utils/siteUrl';

export const getSubjectPage = cache(async (subject, page) => {
  const aliases = { 'computer-science': 'computer', 'pakistan-studies': 'pak-study', 'human-resource-management': 'hrm', law: 'judiciary-law' };
  const apiSubject = aliases[subject] || subject;
  const response = await getMcqListing(
    new Request(`${SITE_URL}/api/mcqs/${apiSubject}?page=${page}&limit=10&include=hierarchy`),
    { params: Promise.resolve({ subject: apiSubject }) }
  );
  if (!response.ok) throw new Error('Unable to load MCQs');
  return { apiSubject, data: await response.json() };
});
