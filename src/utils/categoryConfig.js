// Unified category configuration for all environments
// This file loads category mappings from a single JSON file
// that can be shared across Python scraper, Node.js server, and React client

// For client-side, we'll use a static import since we can't use fs
// We'll define the mappings directly here to avoid file system dependencies

const CATEGORY_MAPPING = {
  "english": "english",
  "general-knowledge": "general-knowledge",
  "pak-study": "pak-study",
  "world-current-affairs": "world-current-affairs",
  "pakistan-current-affairs": "pakistan-current-affairs",
  "islamic-studies": "islamic-studies",
  "everyday-science": "everyday-science",
  "mathematics": "maths",
  "maths": "maths",
  "computer": "computer",
  "pedagogy": "pedagogy",
  "physics": "physics",
  "chemistry": "chemistry",
  "biology": "biology",
  "urdu": "urdu",
  "urdu-general-knowledge": "urdu",
  "psychology": "psychology",
  "agriculture": "agriculture",
  "forestry": "forestry",
  "economics": "economics",
  "sociology": "sociology",
  "political-science": "political-science",
  "statistics": "statistics",
  "english-literature": "english-literature",
  "judiciary-and-law": "judiciary-law",
  "judiciary-law": "judiciary-law",
  "international-relations": "international-relations",
  "physical-education": "physical-education",
  "finance": "finance",
  "hrm": "hrm",
  "marketing": "marketing",
  "accounting": "accounting",
  "auditing": "auditing",
  "electrical-engineering": "electrical-engineering",
  "civil-engineering": "civil-engineering",
  "mechanical-engineering": "mechanical-engineering",
  "chemical-engineering": "chemical-engineering",
  "software-engineering": "software-engineering",
  "medical": "medical",
  "biochemistry": "biochemistry",
  "dental-materials": "dental-materials",
  "general-anatomy": "general-anatomy",
  "microbiology": "microbiology",
  "oral-anatomy": "oral-anatomy",
  "oral-histology": "oral-histology",
  "oral-pathology-and-medicine": "oral-pathology-medicine",
  "oral-pathology-medicine": "oral-pathology-medicine",
  "physiology": "physiology",
  "pathology": "pathology",
  "pharmacology": "pharmacology",
  "engineering": "engineering",
  "election-officer": "election-officer",
  "management-sciences": "management-sciences"
};

const CATEGORIES = [
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

// JavaScript version of normalizeCategoryName
export function normalizeCategoryName(raw) {
  let name = raw.toLowerCase().replace(/_/g, '-');
  if (name.endsWith('-mcqs')) name = name.slice(0, -5);
  if (name.endsWith('-mcq')) name = name.slice(0, -4);
  
  // First try exact matches
  if (CATEGORY_MAPPING[name]) {
    return CATEGORY_MAPPING[name];
  }
  
  // Then try prefix matches for cases where we want partial matching
  // Sort by length (longest first) to ensure more specific matches come first
  const sortedKeys = Object.keys(CATEGORY_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.startsWith(key)) return CATEGORY_MAPPING[key];
  }
  return name;
}

// Get all available categories for the admin panel (sorted alphabetically)
export const getAllCategories = () => {
  return [...CATEGORIES].sort((a, b) => 
    a.label.localeCompare(b.label)
  );
}; 