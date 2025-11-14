/**
 * Past Paper Categories Configuration
 * 
 * This file contains all Past Paper categories organized by commission (SPSC, FPSC, etc.)
 * Edit this file directly to add, remove, or modify Past Paper categories.
 * 
 * Structure:
 * - Commission (SPSC, FPSC, etc.)
 *   - Departments (e.g., College Education Department, Health Department)
 *     - Roles (e.g., Lecturer Computer Science BPS-17, Medical Officer BPS-17)
 */

import { Building2, Landmark, MapPin } from "lucide-react";
export const pastPaperCategories = [{
  title: "STS - SIBA TESTING SERVICES",
  icon: Building2,
  departments: [{
    label: "BPS 05 to 15  ",
    roles: [{
      label: "Graduation Category",
      link: "/past-papers/sts-siba-testing-services/bps-05-to-15-/graduation-category"
    }, {
      label: "Intermediate Category",
      link: "/past-papers/sts-siba-testing-services/bps-05-to-15-/intermediate-category",
      subcategories: [{
        label: "TEST PAST PAPER 23-06-2023",
        link: "/past-papers/sts-siba-testing-services/bps-05-to-15-/intermediate-category/test-past-paper-23-06-2023",
        subcategories: []
      }]
    }, {
      label: "Matriculation Category",
      link: "/past-papers/sts-siba-testing-services/bps-05-to-15-/matriculation-category"
    }]
  }]
}, {
  title: "Sindh Government",
  icon: MapPin,
  departments: [{
    label: "🏛 General Administration and Coordination Department",
    roles: [{
      label: "Junior Clerk BPS‑11",
      link: "/past-papers/government-of-sindh/general-administration/junior-clerk-bps-11"
    }]
  }]
}, {
  title: "SPSC",
  icon: Building2,
  departments: [{
    label: "🏫 College Education Department",
    roles: [{
      label: "Lecturer Computer Science BPS‑17",
      link: "/past-papers/spsc/college-education/lecturer-computer-science-bps-17"
    }, {
      label: "Lecturer Economics BPS‑17",
      link: "/past-papers/spsc/college-education/lecturer-economics-bps-17"
    }, {
      label: "Lecturer English BPS‑17",
      link: "/past-papers/spsc/college-education/lecturer-english-bps-17"
    }, {
      label: "Lecturer Islamiat BPS‑17",
      link: "/past-papers/spsc/college-education/lecturer-islamiat-bps-17"
    }, {
      label: "Lecturer Zoology BPS‑17",
      link: "/past-papers/spsc/college-education/lecturer-zoology-bps-17"
    }]
  }, {
    label: "🩺 Health Department",
    roles: [{
      label: "Clinical Instructor BPS‑17",
      link: "/past-papers/spsc/health/clinical-instructor-bps-17"
    }, {
      label: "Medical Officer BPS‑17",
      link: "/past-papers/spsc/health/medical-officer-bps-17"
    }, {
      label: "Nursing Instructor BPS‑17",
      link: "/past-papers/spsc/health/nursing-instructor-bps-17"
    }, {
      label: "Staff Nurse BPS‑16",
      link: "/past-papers/spsc/health/staff-nurse-bps-16"
    }, {
      label: "Women Medical Officer BPS‑17",
      link: "/past-papers/spsc/health/women-medical-officer-bps-17"
    }]
  }, {
    label: "⚖ Law & Prosecution Department",
    roles: [{
      label: "Assistant District Public Prosecutor BPS‑17",
      link: "/past-papers/spsc/law-prosecution/assistant-district-public-prosecutor-bps-17"
    }, {
      label: "Assistant Prosecutor General BPS‑17",
      link: "/past-papers/spsc/law-prosecution/assistant-prosecutor-general-bps-17"
    }, {
      label: "Reader BPS‑17",
      link: "/past-papers/spsc/law-prosecution/reader-bps-17"
    }]
  }, {
    label: "🏫 School Education & Literacy Department",
    roles: [{
      label: "Secondary School Teacher (SST) BPS‑16",
      link: "/past-papers/spsc/school-education/secondary-school-teacher-bps-16"
    }, {
      label: "Subject Specialist Chemistry BPS‑17",
      link: "/past-papers/spsc/school-education/subject-specialist-chemistry-bps-17"
    }, {
      label: "Subject Specialist Zoology BPS‑17",
      link: "/past-papers/spsc/school-education/subject-specialist-zoology-bps-17"
    }]
  }, {
    label: "🏛 Social Welfare Department",
    roles: [{
      label: "Assistant Director Social Welfare BPS‑17",
      link: "/past-papers/spsc/social-welfare/assistant-director-social-welfare-bps-17"
    }]
  }]
}, {
  title: "FPSC",
  icon: Landmark,
  departments: [{
    label: "🏢 Administrative & Management",
    roles: [{
      label: "Accounts Officer BPS‑?",
      link: "/past-papers/fpsc/admin/accounts-officer-bps"
    }, {
      label: "Administrative Officer BPS‑?",
      link: "/past-papers/fpsc/admin/administrative-officer-bps"
    }, {
      label: "Deputy Director BPS‑?",
      link: "/past-papers/fpsc/admin/deputy-director-bps"
    }, {
      label: "Inspector (Customs/etc.) BPS‑?",
      link: "/past-papers/fpsc/admin/inspector-bps"
    }, {
      label: "IT Supervisor BPS‑?",
      link: "/past-papers/fpsc/admin/it-supervisor-bps"
    }, {
      label: "Librarian/Chief Librarian BPS‑?",
      link: "/past-papers/fpsc/admin/librarian-bps"
    }, {
      label: "Project Manager BPS‑?",
      link: "/past-papers/fpsc/admin/project-manager-bps"
    }, {
      label: "Software Assistant Director BPS‑?",
      link: "/past-papers/fpsc/admin/software-assistant-director-bps"
    }, {
      label: "Transport Officer BPS‑?",
      link: "/past-papers/fpsc/admin/transport-officer-bps"
    }]
  }, {
    label: "🎓 Education & Academia",
    roles: [{
      label: "Assistant Professor (Female) BPS‑18",
      link: "/past-papers/fpsc/education/assistant-professor-female-bps-18"
    }, {
      label: "Assistant Professor (Male) BPS‑18",
      link: "/past-papers/fpsc/education/assistant-professor-male-bps-18"
    }, {
      label: "Associate Professor BPS‑19",
      link: "/past-papers/fpsc/education/associate-professor-bps-19"
    }, {
      label: "Lecturer (Female) BPS‑17",
      link: "/past-papers/fpsc/education/lecturer-female-bps-17"
    }, {
      label: "Lecturer (Male) BPS‑17",
      link: "/past-papers/fpsc/education/lecturer-male-bps-17"
    }, {
      label: "Physical Education Teacher (Female) BPS‑17",
      link: "/past-papers/fpsc/education/physical-education-teacher-female-bps-17"
    }, {
      label: "Secondary School Teacher (Female) BPS‑17",
      link: "/past-papers/fpsc/education/secondary-school-teacher-female-bps-17"
    }, {
      label: "Secondary School Teacher (Male) BPS‑17",
      link: "/past-papers/fpsc/education/secondary-school-teacher-male-bps-17"
    }, {
      label: "Trained Graduate Teacher (Female/Male) BPS‑17",
      link: "/past-papers/fpsc/education/trained-graduate-teacher-bps-17"
    }]
  }, {
    label: "🛠 Engineering & Technical",
    roles: [{
      label: "Assistant Electrical Engineer BPS‑17",
      link: "/past-papers/fpsc/engineering/assistant-electrical-engineer-bps-17"
    }, {
      label: "Assistant Engineer (Civil) BPS‑17",
      link: "/past-papers/fpsc/engineering/assistant-engineer-civil-bps-17"
    }, {
      label: "Chief Technician (Cardiology/etc.) BPS‑?",
      link: "/past-papers/fpsc/engineering/chief-technician-bps"
    }, {
      label: "Junior Architect BPS‑?",
      link: "/past-papers/fpsc/engineering/junior-architect-bps"
    }]
  }, {
    label: "🏥 Health & Medical",
    roles: [{
      label: "Biochemist BPS‑17",
      link: "/past-papers/fpsc/health/biochemist-bps-17"
    }, {
      label: "Charge Nurse BPS‑17",
      link: "/past-papers/fpsc/health/charge-nurse-bps-17"
    }, {
      label: "Civil Medical Officer BPS‑17",
      link: "/past-papers/fpsc/health/civil-medical-officer-bps-17"
    }, {
      label: "CMP (Grade‑III) BPS‑17",
      link: "/past-papers/fpsc/health/cmp-grade-iii-bps-17"
    }, {
      label: "Medical Officer BPS‑17",
      link: "/past-papers/fpsc/health/medical-officer-bps-17"
    }, {
      label: "Nutritionist BPS‑?",
      link: "/past-papers/fpsc/health/nutritionist-bps"
    }, {
      label: "Occupational Therapist BPS‑17",
      link: "/past-papers/fpsc/health/occupational-therapist-bps-17"
    }, {
      label: "Physiotherapist BPS‑17",
      link: "/past-papers/fpsc/health/physiotherapist-bps-17"
    }, {
      label: "Staff Nurse BPS‑17",
      link: "/past-papers/fpsc/health/staff-nurse-bps-17"
    }]
  }]
}];

/**
 * Helper function to sort departments alphabetically within each commission
 */
export function sortPastPaperCategories() {
  return pastPaperCategories.map(commission => ({
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
 * Get all Past Paper categories (sorted)
 */
export function getPastPaperCategories() {
  return sortPastPaperCategories();
}