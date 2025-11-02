# Category Files Guide

This document explains how category files are organized and how to edit them directly.

## File Structure

Categories are now organized into separate, easy-to-edit files:

```
src/data/categories/
├── mcqsCategories.js              # MCQ categories (all subjects)
├── pastPapersCategories.js       # Past Paper categories (SPSC, FPSC departments & roles)
├── pastInterviewsCategories.js    # Past Interview categories (SPSC, FPSC departments & roles)
└── mockTestCategories.js         # Mock Test categories (Universities, etc.)

src/utils/
└── categoryConfig.js              # Legacy MCQ category mappings (for normalization)
```

## How to Edit Categories

### 1. MCQ Categories (`src/data/categories/mcqsCategories.js`)

**To add a new MCQ category:**
1. Open `src/data/categories/mcqsCategories.js`
2. Add a new entry to the `mcqCategories` array:
   ```javascript
   { "value": "new-subject", "label": "New Subject" }
   ```
3. Save the file - changes will be reflected immediately

**Example:**
```javascript
export const mcqCategories = [
  { "value": "english", "label": "English" },
  { "value": "general-knowledge", "label": "General Knowledge" },
  // ... add your new category here
  { "value": "my-new-subject", "label": "My New Subject" }
];
```

### 2. Past Paper Categories (`src/data/categories/pastPapersCategories.js`)

**To add a new Past Paper category:**
1. Open `src/data/categories/pastPapersCategories.js`
2. Find the appropriate commission (SPSC or FPSC)
3. Add a department or role within an existing department

**Structure:**
```javascript
{
  title: "SPSC",
  departments: [
    {
      label: "🏫 Department Name",
      roles: [
        { label: "Role Name BPS‑XX", link: "/past-papers/spsc/department/role-slug" }
      ]
    }
  ]
}
```

**Example - Adding a new department:**
```javascript
{
  label: "🏢 New Department",
  roles: [
    { label: "New Role BPS‑17", link: "/past-papers/spsc/new-department/new-role-bps-17" }
  ]
}
```

**Example - Adding a role to existing department:**
```javascript
{
  label: "🏫 College Education Department",
  roles: [
    // ... existing roles
    { label: "New Lecturer BPS‑17", link: "/past-papers/spsc/college-education/new-lecturer-bps-17" }
  ]
}
```

### 3. Past Interview Categories (`src/data/categories/pastInterviewsCategories.js`)

**Same structure as Past Papers** - edit `src/data/categories/pastInterviewsCategories.js`

**Example - Adding "Junior Clerk BPS-11":**
```javascript
{
  label: "🏛 General Administration and Coordination Department",
  roles: [
    { label: "Junior Clerk BPS‑11", link: "/past-interviews/spsc/general-administration/junior-clerk-bps-11" }
  ]
}
```

### 4. Mock Test Categories (`src/data/categories/mockTestCategories.js`)

**To add a new university or category:**
1. Open `src/data/categories/mockTestCategories.js`
2. Edit the `universities` array or `categories` array

## Automatic Sorting

All category files include automatic alphabetical sorting:

- **Past Papers & Interviews**: Departments are sorted alphabetically, roles within each department are sorted alphabetically
- **MCQs**: Categories are sorted alphabetically
- **Mock Tests**: Universities and categories are sorted alphabetically

## How It Works

### Component Integration

- **PastInterviewsRightSideBar.jsx**: Imports from `pastInterviewsCategories.js`
- **PastPapersRightSideBar.jsx**: Imports from `pastPapersCategories.js`
- **RightSideBar.jsx** (MCQs): Uses `categoryConfig.js` (can be migrated to `mcqsCategories.js`)
- **MockTestsRightSideBar.jsx**: Uses `mockTestCategories.js`

### Automatic Updates

When you edit a category file:
1. Save the file
2. The Next.js development server will automatically reload
3. Changes appear immediately in the sidebar
4. No code changes needed in components

## URL Structure

When adding new categories, follow this URL pattern:

- **Past Papers**: `/past-papers/{commission}/{department-slug}/{role-slug}`
- **Past Interviews**: `/past-interviews/{commission}/{department-slug}/{role-slug}`
- **MCQs**: `/mcqs/{subject-slug}`
- **Mock Tests**: `/mock-tests/universities/{university-slug}`

**Slug Rules:**
- Use lowercase
- Replace spaces with hyphens
- Keep it short but descriptive
- Example: "Junior Clerk BPS-11" → `junior-clerk-bps-11`

## Quick Reference

| Category Type | File Location | Structure |
|--------------|---------------|-----------|
| MCQs | `src/data/categories/mcqsCategories.js` | Array of `{value, label}` |
| Past Papers | `src/data/categories/pastPapersCategories.js` | Commission → Departments → Roles |
| Past Interviews | `src/data/categories/pastInterviewsCategories.js` | Commission → Departments → Roles |
| Mock Tests | `src/data/categories/mockTestCategories.js` | Categories → Universities |

## Notes

- All files support automatic sorting
- Changes are reflected immediately (hot-reload)
- No need to restart the server
- Backward compatible - existing code continues to work
- Categories are validated and normalized automatically

