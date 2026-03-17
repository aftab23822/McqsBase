/**
 * Past Interview Categories Configuration
 * 
 * This file contains all Past Interview categories organized by commission (SPSC, FPSC, etc.)
 * Edit this file directly to add, remove, or modify Past Interview categories.
 * 
 * Structure:
 * - Commission (SPSC, FPSC, etc.)
 *   - Departments (e.g., College Education Department, Health Department)
 *     - Roles (e.g., Lecturer Computer Science BPS-17, Medical Officer BPS-17)
 */

import { Building2, Landmark, MapPin } from "lucide-react";

export const pastInterviewCategories = [
  {
    title: "Sindh Government",
    icon: MapPin,
    departments: [
      {
        label: "👨‍💻 Junior Clerk",
        link: "/past-interviews/sindh-government/junior-clerk",
        roles: []
      }
    ]
  },
  {
    title: "SPSC",
    icon: Building2,
    departments: [
      {
        label: "🏫 College Education Department",
        roles: [
          { label: "Lecturer Computer Science BPS‑17", link: "/past-interviews/spsc/college-education/lecturer-computer-science-bps-17" },
          { label: "Lecturer Economics BPS‑17", link: "/past-interviews/spsc/college-education/lecturer-economics-bps-17" },
          { label: "Lecturer English BPS‑17", link: "/past-interviews/spsc/college-education/lecturer-english-bps-17" },
          { label: "Lecturer Islamiat BPS‑17", link: "/past-interviews/spsc/college-education/lecturer-islamiat-bps-17" },
          { label: "Lecturer Zoology BPS‑17", link: "/past-interviews/spsc/college-education/lecturer-zoology-bps-17" }
        ]
      },
      {
        label: "🩺 Health Department",
        roles: [
          { label: "Clinical Instructor BPS‑17", link: "/past-interviews/spsc/health/clinical-instructor-bps-17" },
          { label: "Medical Officer BPS‑17", link: "/past-interviews/spsc/health/medical-officer-bps-17" },
          { label: "Nursing Instructor BPS‑17", link: "/past-interviews/spsc/health/nursing-instructor-bps-17" },
          { label: "Staff Nurse BPS‑16", link: "/past-interviews/spsc/health/staff-nurse-bps-16" },
          { label: "Women Medical Officer BPS‑17", link: "/past-interviews/spsc/health/women-medical-officer-bps-17" }
        ]
      },
      {
        label: "⚖ Law & Prosecution Department",
        roles: [
          { label: "Assistant District Public Prosecutor BPS‑17", link: "/past-interviews/spsc/law-prosecution/assistant-district-public-prosecutor-bps-17" },
          { label: "Assistant Prosecutor General BPS‑17", link: "/past-interviews/spsc/law-prosecution/assistant-prosecutor-general-bps-17" },
          { label: "Reader BPS‑17", link: "/past-interviews/spsc/law-prosecution/reader-bps-17" }
        ]
      },
      {
        label: "🏫 School Education & Literacy Department",
        roles: [
          { label: "Secondary School Teacher (SST) BPS‑16", link: "/past-interviews/spsc/school-education/secondary-school-teacher-bps-16" },
          { label: "Subject Specialist Chemistry BPS‑17", link: "/past-interviews/spsc/school-education/subject-specialist-chemistry-bps-17" },
          { label: "Subject Specialist Zoology BPS‑17", link: "/past-interviews/spsc/school-education/subject-specialist-zoology-bps-17" }
        ]
      },
      {
        label: "🏛 Social Welfare Department",
        roles: [
          { label: "Assistant Director Social Welfare BPS‑17", link: "/past-interviews/spsc/social-welfare/assistant-director-social-welfare-bps-17" }
        ]
      }
    ]
  },
  {
    title: "FPSC",
    icon: Landmark,
    departments: [
      {
        label: "🏢 Administrative & Management",
        roles: [
          { label: "Accounts Officer BPS‑?", link: "/past-interviews/fpsc/admin/accounts-officer-bps" },
          { label: "Administrative Officer BPS‑?", link: "/past-interviews/fpsc/admin/administrative-officer-bps" },
          { label: "Deputy Director BPS‑?", link: "/past-interviews/fpsc/admin/deputy-director-bps" },
          { label: "Inspector (Customs/etc.) BPS‑?", link: "/past-interviews/fpsc/admin/inspector-bps" },
          { label: "IT Supervisor BPS‑?", link: "/past-interviews/fpsc/admin/it-supervisor-bps" },
          { label: "Librarian/Chief Librarian BPS‑?", link: "/past-interviews/fpsc/admin/librarian-bps" },
          { label: "Project Manager BPS‑?", link: "/past-interviews/fpsc/admin/project-manager-bps" },
          { label: "Software Assistant Director BPS‑?", link: "/past-interviews/fpsc/admin/software-assistant-director-bps" },
          { label: "Transport Officer BPS‑?", link: "/past-interviews/fpsc/admin/transport-officer-bps" }
        ]
      },
      {
        label: "🎓 Education & Academia",
        roles: [
          { label: "Assistant Professor (Female) BPS‑18", link: "/past-interviews/fpsc/education/assistant-professor-female-bps-18" },
          { label: "Assistant Professor (Male) BPS‑18", link: "/past-interviews/fpsc/education/assistant-professor-male-bps-18" },
          { label: "Associate Professor BPS‑19", link: "/past-interviews/fpsc/education/associate-professor-bps-19" },
          { label: "Lecturer (Female) BPS‑17", link: "/past-interviews/fpsc/education/lecturer-female-bps-17" },
          { label: "Lecturer (Male) BPS‑17", link: "/past-interviews/fpsc/education/lecturer-male-bps-17" },
          { label: "Physical Education Teacher (Female) BPS‑17", link: "/past-interviews/fpsc/education/physical-education-teacher-female-bps-17" },
          { label: "Secondary School Teacher (Female) BPS‑17", link: "/past-interviews/fpsc/education/secondary-school-teacher-female-bps-17" },
          { label: "Secondary School Teacher (Male) BPS‑17", link: "/past-interviews/fpsc/education/secondary-school-teacher-male-bps-17" },
          { label: "Trained Graduate Teacher (Female/Male) BPS‑17", link: "/past-interviews/fpsc/education/trained-graduate-teacher-bps-17" }
        ]
      },
      {
        label: "🛠 Engineering & Technical",
        roles: [
          { label: "Assistant Electrical Engineer BPS‑17", link: "/past-interviews/fpsc/engineering/assistant-electrical-engineer-bps-17" },
          { label: "Assistant Engineer (Civil) BPS‑17", link: "/past-interviews/fpsc/engineering/assistant-engineer-civil-bps-17" },
          { label: "Chief Technician (Cardiology/etc.) BPS‑?", link: "/past-interviews/fpsc/engineering/chief-technician-bps" },
          { label: "Junior Architect BPS‑?", link: "/past-interviews/fpsc/engineering/junior-architect-bps" }
        ]
      },
      {
        label: "🏥 Health & Medical",
        roles: [
          { label: "Biochemist BPS‑17", link: "/past-interviews/fpsc/health/biochemist-bps-17" },
          { label: "Charge Nurse BPS‑17", link: "/past-interviews/fpsc/health/charge-nurse-bps-17" },
          { label: "Civil Medical Officer BPS‑17", link: "/past-interviews/fpsc/health/civil-medical-officer-bps-17" },
          { label: "CMP (Grade‑III) BPS‑17", link: "/past-interviews/fpsc/health/cmp-grade-iii-bps-17" },
          { label: "Medical Officer BPS‑17", link: "/past-interviews/fpsc/health/medical-officer-bps-17" },
          { label: "Nutritionist BPS‑?", link: "/past-interviews/fpsc/health/nutritionist-bps" },
          { label: "Occupational Therapist BPS‑17", link: "/past-interviews/fpsc/health/occupational-therapist-bps-17" },
          { label: "Physiotherapist BPS‑17", link: "/past-interviews/fpsc/health/physiotherapist-bps-17" },
          { label: "Staff Nurse BPS‑17", link: "/past-interviews/fpsc/health/staff-nurse-bps-17" }
        ]
      }
    ]
  }
];

/**
 * Helper function to sort departments alphabetically within each commission
 */
export function sortPastInterviewCategories() {
  return pastInterviewCategories.map(commission => ({
    ...commission,
    departments: [...commission.departments].sort((a, b) => {
      // Remove emoji for sorting
      const labelA = a.label.replace(/^[^\w\s]+/, '').trim();
      const labelB = b.label.replace(/^[^\w\s]+/, '').trim();
      return labelA.localeCompare(labelB);
    }).map(dept => ({
      ...dept,
      roles: dept.roles ? [...dept.roles].filter(r => r && r.label).sort((a, b) => {
        const labelA = a?.label || '';
        const labelB = b?.label || '';
        return labelA.localeCompare(labelB);
      }) : []
    }))
  }));
}

/**
 * Get all Past Interview categories (sorted)
 */
export function getPastInterviewCategories() {
  return sortPastInterviewCategories();
}
