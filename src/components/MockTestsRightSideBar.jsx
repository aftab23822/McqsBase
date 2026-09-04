'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Landmark, GraduationCap, BookOpen } from 'lucide-react';
import {
  getMockTestCategories as getStaticMockTestCategories,
  getUniversities as getStaticUniversities
} from '../data/categories/mockTestCategories';

const STATIC_MOCK_SECTIONS = [
  {
    title: 'SPSC',
    icon: Building2,
    departments: [
      {
        label: '🏫 College Education Department',
        roles: [
          { label: 'Lecturer Computer Science BPS‑17', link: '/mock-tests/spsc/college-education/lecturer-computer-science-bps-17' },
          { label: 'Lecturer Economics BPS‑17', link: '/mock-tests/spsc/college-education/lecturer-economics-bps-17' },
          { label: 'Lecturer English BPS‑17', link: '/mock-tests/spsc/college-education/lecturer-english-bps-17' },
          { label: 'Lecturer Islamiat BPS‑17', link: '/mock-tests/spsc/college-education/lecturer-islamiat-bps-17' },
          { label: 'Lecturer Zoology BPS‑17', link: '/mock-tests/spsc/college-education/lecturer-zoology-bps-17' },
        ],
      },
      {
        label: '🩺 Health Department',
        roles: [
          { label: 'Clinical Instructor BPS‑17', link: '/mock-tests/spsc/health/clinical-instructor-bps-17' },
          { label: 'Medical Officer BPS‑17', link: '/mock-tests/spsc/health/medical-officer-bps-17' },
          { label: 'Nursing Instructor BPS‑17', link: '/mock-tests/spsc/health/nursing-instructor-bps-17' },
          { label: 'Staff Nurse BPS‑16', link: '/mock-tests/spsc/health/staff-nurse-bps-16' },
          { label: 'Women Medical Officer BPS‑17', link: '/mock-tests/spsc/health/women-medical-officer-bps-17' },
        ],
      },
      {
        label: '⚖ Law & Prosecution Department',
        roles: [
          { label: 'Assistant District Public Prosecutor BPS‑17', link: '/mock-tests/spsc/law-prosecution/assistant-district-public-prosecutor-bps-17' },
          { label: 'Assistant Prosecutor General BPS‑17', link: '/mock-tests/spsc/law-prosecution/assistant-prosecutor-general-bps-17' },
          { label: 'Reader BPS‑17', link: '/mock-tests/spsc/law-prosecution/reader-bps-17' },
        ],
      },
      {
        label: '🏫 School Education & Literacy Department',
        roles: [
          { label: 'Secondary School Teacher (SST) BPS‑16', link: '/mock-tests/spsc/school-education/secondary-school-teacher-bps-16' },
          { label: 'Subject Specialist Chemistry BPS‑17', link: '/mock-tests/spsc/school-education/subject-specialist-chemistry-bps-17' },
          { label: 'Subject Specialist Zoology BPS‑17', link: '/mock-tests/spsc/school-education/subject-specialist-zoology-bps-17' },
        ],
      },
      {
        label: '🏛 Social Welfare Department',
        roles: [
          { label: 'Assistant Director Social Welfare BPS‑17', link: '/mock-tests/spsc/social-welfare/assistant-director-social-welfare-bps-17' },
        ],
      },
    ],
  },
  {
    title: 'FPSC',
    icon: Landmark,
    departments: [
      {
        label: '🏢 Administrative & Management',
        roles: [
          { label: 'Accounts Officer BPS‑?', link: '/mock-tests/fpsc/admin/accounts-officer-bps' },
          { label: 'Administrative Officer BPS‑?', link: '/mock-tests/fpsc/admin/administrative-officer-bps' },
          { label: 'Deputy Director BPS‑?', link: '/mock-tests/fpsc/admin/deputy-director-bps' },
          { label: 'Inspector (Customs/etc.) BPS‑?', link: '/mock-tests/fpsc/admin/inspector-bps' },
          { label: 'IT Supervisor BPS‑?', link: '/mock-tests/fpsc/admin/it-supervisor-bps' },
          { label: 'Librarian/Chief Librarian BPS‑?', link: '/mock-tests/fpsc/admin/librarian-bps' },
          { label: 'Project Manager BPS‑?', link: '/mock-tests/fpsc/admin/project-manager-bps' },
          { label: 'Software Assistant Director BPS‑?', link: '/mock-tests/fpsc/admin/software-assistant-director-bps' },
          { label: 'Transport Officer BPS‑?', link: '/mock-tests/fpsc/admin/transport-officer-bps' },
        ],
      },
      {
        label: '🎓 Education & Academia',
        roles: [
          { label: 'Associate Professor BPS‑19', link: '/mock-tests/fpsc/education/associate-professor-bps-19' },
          { label: 'Assistant Professor (Female) BPS‑18', link: '/mock-tests/fpsc/education/assistant-professor-female-bps-18' },
          { label: 'Assistant Professor (Male) BPS‑18', link: '/mock-tests/fpsc/education/assistant-professor-male-bps-18' },
          { label: 'Lecturer (Female) BPS‑17', link: '/mock-tests/fpsc/education/lecturer-female-bps-17' },
          { label: 'Lecturer (Male) BPS‑17', link: '/mock-tests/fpsc/education/lecturer-male-bps-17' },
          { label: 'Physical Education Teacher (Female) BPS‑17', link: '/mock-tests/fpsc/education/physical-education-teacher-female-bps-17' },
          { label: 'Secondary School Teacher (Female) BPS‑17', link: '/mock-tests/fpsc/education/secondary-school-teacher-female-bps-17' },
          { label: 'Secondary School Teacher (Male) BPS‑17', link: '/mock-tests/fpsc/education/secondary-school-teacher-male-bps-17' },
          { label: 'Trained Graduate Teacher (Female/Male) BPS‑17', link: '/mock-tests/fpsc/education/trained-graduate-teacher-bps-17' },
        ],
      },
      {
        label: '🛠 Engineering & Technical',
        roles: [
          { label: 'Assistant Electrical Engineer BPS‑17', link: '/mock-tests/fpsc/engineering/assistant-electrical-engineer-bps-17' },
          { label: 'Assistant Engineer (Civil) BPS‑17', link: '/mock-tests/fpsc/engineering/assistant-engineer-civil-bps-17' },
          { label: 'Chief Technician (Cardiology/etc.) BPS‑?', link: '/mock-tests/fpsc/engineering/chief-technician-bps' },
          { label: 'Junior Architect BPS‑?', link: '/mock-tests/fpsc/engineering/junior-architect-bps' },
        ],
      },
      {
        label: '🏥 Health & Medical',
        roles: [
          { label: 'Biochemist BPS‑17', link: '/mock-tests/fpsc/health/biochemist-bps-17' },
          { label: 'Charge Nurse BPS‑17', link: '/mock-tests/fpsc/health/charge-nurse-bps-17' },
          { label: 'Civil Medical Officer BPS‑17', link: '/mock-tests/fpsc/health/civil-medical-officer-bps-17' },
          { label: 'CMP (Grade‑III) BPS‑17', link: '/mock-tests/fpsc/health/cmp-grade-iii-bps-17' },
          { label: 'Medical Officer BPS‑17', link: '/mock-tests/fpsc/health/medical-officer-bps-17' },
          { label: 'Nutritionist BPS‑?', link: '/mock-tests/fpsc/health/nutritionist-bps' },
          { label: 'Occupational Therapist BPS‑17', link: '/mock-tests/fpsc/health/occupational-therapist-bps-17' },
          { label: 'Physiotherapist BPS‑17', link: '/mock-tests/fpsc/health/physiotherapist-bps-17' },
          { label: 'Staff Nurse BPS‑17', link: '/mock-tests/fpsc/health/staff-nurse-bps-17' },
        ],
      },
    ],
  },
];

const MockTestsRightSideBar = () => {
  const [categories, setCategories] = useState(() => getStaticMockTestCategories());
  const [universities, setUniversities] = useState(() => getStaticUniversities());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/categories/structure?type=mock-tests');
        const json = await res.json();
        if (!cancelled && json.success) {
          if (Array.isArray(json.data?.categories) && json.data.categories.length) {
            setCategories(json.data.categories);
          }
          if (Array.isArray(json.data?.universities) && json.data.universities.length) {
            setUniversities(json.data.universities);
          }
        }
      } catch {
        /* keep static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mockTestCategories = useMemo(() => {
    const nonUniversityCategoryValues = new Set(
      categories
        .filter((category) => category.value && category.value !== 'universities')
        .map((category) => category.value)
    );
    const uniRoles = universities
      .filter((u) => !nonUniversityCategoryValues.has(u.slug))
      .map((u) => ({
      label: u.label,
      full: u.full,
      link: `/mock-tests/universities/${u.slug}`,
    }));
    const configuredSections = categories
      .filter((category) => category.value && category.value !== 'universities')
      .map((category) => ({
        title: category.label,
        icon: BookOpen,
        departments: [{
          label: 'Mock Tests',
          roles: [{
            label: `${category.label} Mock Tests`,
            link: `/mock-tests/${category.value}`,
          }],
        }],
      }));
    const universitiesCategoryLabel = categories.find((category) => category.value === 'universities')?.label || 'Universities';

    return [
      {
        title: universitiesCategoryLabel,
        icon: GraduationCap,
        departments: [{ label: 'Top Universities', roles: uniRoles }],
      },
      ...configuredSections,
      ...STATIC_MOCK_SECTIONS,
    ];
  }, [categories, universities]);

  return (
    <div className="col-span-1 p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">Mock Tests</h3>

      {mockTestCategories.map((cat, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-indigo-600 mt-4">
            <cat.icon size={20} />
            {cat.title}
          </div>

          {cat.departments.map((dept, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
              <div className="font-medium text-gray-700 mb-1">{dept.label}</div>
              {dept.roles && (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {dept.roles.map((role, j) => (
                    <li key={j}>
                      <Link
                        href={role.link}
                        className="hover:text-indigo-500 transition-colors"
                        title={role.full || role.label}
                      >
                        {role.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MockTestsRightSideBar;
