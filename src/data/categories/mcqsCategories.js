/**
 * MCQ Categories Configuration
 * 
 * This file contains all MCQ categories organized by subject type.
 * Edit this file directly to add, remove, or modify MCQ categories.
 * 
 * Categories are organized into groups:
 * - Main MCQs Menu
 * - Engineering MCQs
 * - Medical Subjects
 * - Other Subjects
 */

export const mcqCategories = [
  { "value": "english", "label": "English" },
  { "value": "general-knowledge", "label": "General Knowledge" },
  { "value": "pak-study", "label": "Pakistan Studies" },
  { "value": "world-current-affairs", "label": "World Current Affairs" },
  { "value": "pakistan-current-affairs", "label": "Pakistan Current Affairs" },
  { "value": "islamic-studies", "label": "Islamic Studies" },
  { "value": "everyday-science", "label": "Everyday Science" },
  { "value": "maths", "label": "Mathematics" },
  { "value": "computer", "label": "Computer" },
  { "value": "pedagogy", "label": "Pedagogy" },
  { "value": "physics", "label": "Physics" },
  { "value": "chemistry", "label": "Chemistry" },
  { "value": "biology", "label": "Biology" },
  { "value": "urdu", "label": "Urdu" },
  { "value": "psychology", "label": "Psychology" },
  { "value": "agriculture", "label": "Agriculture" },
  { "value": "forestry", "label": "Forestry" },
  { "value": "economics", "label": "Economics" },
  { "value": "sociology", "label": "Sociology" },
  { "value": "political-science", "label": "Political Science" },
  { "value": "statistics", "label": "Statistics" },
  { "value": "english-literature", "label": "English Literature" },
  { "value": "judiciary-and-law", "label": "Judiciary and Law" },
  { "value": "international-relations", "label": "International Relations" },
  { "value": "physical-education", "label": "Physical Education" },
  { "value": "finance", "label": "Finance" },
  { "value": "hrm", "label": "HRM" },
  { "value": "marketing", "label": "Marketing" },
  { "value": "accounting", "label": "Accounting" },
  { "value": "auditing", "label": "Auditing" },
  { "value": "electrical-engineering", "label": "Electrical Engineering" },
  { "value": "civil-engineering", "label": "Civil Engineering" },
  { "value": "mechanical-engineering", "label": "Mechanical Engineering" },
  { "value": "chemical-engineering", "label": "Chemical Engineering" },
  { "value": "software-engineering", "label": "Software Engineering" },
  { "value": "medical", "label": "Medical" },
  { "value": "biochemistry", "label": "Biochemistry" },
  { "value": "dental-materials", "label": "Dental Materials" },
  { "value": "general-anatomy", "label": "General Anatomy" },
  { "value": "microbiology", "label": "Microbiology" },
  { "value": "oral-anatomy", "label": "Oral Anatomy" },
  { "value": "oral-histology", "label": "Oral Histology" },
  { "value": "oral-pathology-medicine", "label": "Oral Pathology Medicine" },
  { "value": "physiology", "label": "Physiology" },
  { "value": "pathology", "label": "Pathology" },
  { "value": "pharmacology", "label": "Pharmacology" },
  { "value": "engineering", "label": "Engineering" },
  { "value": "election-officer", "label": "Election Officer" },
  { "value": "management-sciences", "label": "Management Sciences" }
];

/**
 * Get all MCQ categories (sorted alphabetically)
 */
export function getMcqCategories() {
  return [...mcqCategories].sort((a, b) => 
    a.label.localeCompare(b.label)
  );
}

/**
 * Get MCQ categories grouped by type
 */
export function getMcqCategoriesGrouped() {
  const mainCategories = [
    "english", "general-knowledge", "pak-study", "world-current-affairs",
    "pakistan-current-affairs", "islamic-studies", "everyday-science",
    "maths", "computer", "pedagogy", "physics", "chemistry", "biology", "urdu"
  ];
  
  const engineeringCategories = [
    "electrical-engineering", "civil-engineering", "mechanical-engineering",
    "chemical-engineering", "software-engineering", "engineering"
  ];
  
  const medicalCategories = [
    "medical", "biochemistry", "dental-materials", "general-anatomy",
    "microbiology", "oral-anatomy", "oral-histology", "oral-pathology-medicine",
    "physiology", "pathology", "pharmacology"
  ];
  
  const allCategories = getMcqCategories();
  
  return {
    main: allCategories.filter(cat => mainCategories.includes(cat.value)),
    engineering: allCategories.filter(cat => engineeringCategories.includes(cat.value)),
    medical: allCategories.filter(cat => medicalCategories.includes(cat.value)),
    other: allCategories.filter(cat => 
      !mainCategories.includes(cat.value) && 
      !engineeringCategories.includes(cat.value) && 
      !medicalCategories.includes(cat.value)
    )
  };
}

