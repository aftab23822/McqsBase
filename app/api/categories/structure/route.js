/**
 * API Route for Managing Category Structure
 * 
 * This endpoint provides structured category data for dropdowns
 * and allows updating category files
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CATEGORIES_DIR = path.join(process.cwd(), 'src', 'data', 'categories');

/**
 * GET - Get category structure for a specific type
 * Query params: type (mcqs|past-papers|past-interviews|mock-tests)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    // Import category data dynamically based on type
    let categoryData;
    try {
      switch (type) {
        case 'mcqs':
          const mcqsModule = await import('../../../../src/data/categories/mcqsCategories.js');
          categoryData = {
            categories: mcqsModule.getMcqCategories ? mcqsModule.getMcqCategories() : mcqsModule.mcqCategories || []
          };
          break;
        
        case 'past-papers':
          const pastPapersModule = await import('../../../../src/data/categories/pastPapersCategories.js');
          const pastPapersData = pastPapersModule.getPastPaperCategories ? pastPapersModule.getPastPaperCategories() : pastPapersModule.pastPaperCategories || [];
          // Convert icon objects to icon name strings
          categoryData = {
            commissions: pastPapersData.map(comm => {
              let iconName = 'Building2';
              if (typeof comm.icon === 'string') {
                iconName = comm.icon;
              } else if (comm.icon && typeof comm.icon === 'function') {
                // React component - extract name from function name
                iconName = comm.icon.name || comm.icon.displayName || 'Building2';
              } else if (comm.icon && typeof comm.icon === 'object') {
                iconName = comm.icon.name || comm.icon.displayName || 'Building2';
              }
              return {
                ...comm,
                icon: iconName
              };
            })
          };
          break;
        
        case 'past-interviews':
          const pastInterviewsModule = await import('../../../../src/data/categories/pastInterviewsCategories.js');
          const pastInterviewsData = pastInterviewsModule.getPastInterviewCategories ? pastInterviewsModule.getPastInterviewCategories() : pastInterviewsModule.pastInterviewCategories || [];
          // Convert icon objects to icon name strings
          categoryData = {
            commissions: pastInterviewsData.map(comm => {
              let iconName = 'Building2';
              if (typeof comm.icon === 'string') {
                iconName = comm.icon;
              } else if (comm.icon && typeof comm.icon === 'function') {
                // React component - extract name from function name
                iconName = comm.icon.name || comm.icon.displayName || 'Building2';
              } else if (comm.icon && typeof comm.icon === 'object') {
                iconName = comm.icon.name || comm.icon.displayName || 'Building2';
              }
              return {
                ...comm,
                icon: iconName
              };
            })
          };
          break;
        
        case 'mock-tests':
          const mockTestsModule = await import('../../../../src/data/categories/mockTestCategories.js');
          categoryData = {
            categories: mockTestsModule.getMockTestCategories ? mockTestsModule.getMockTestCategories() : mockTestsModule.MOCK_TEST_CATEGORIES || [],
            universities: mockTestsModule.getUniversities ? mockTestsModule.getUniversities() : mockTestsModule.UNIVERSITIES || []
          };
          break;
        
        default:
          return NextResponse.json(
            { error: 'Invalid type parameter' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        type,
        data: categoryData
      });

    } catch (importError) {
      console.error('Error importing category module:', importError);
      return NextResponse.json(
        { error: 'Failed to load category data', details: importError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in GET /api/categories/structure:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Add new entry to category structure
 * Body: { type, action, data }
 * Actions: 
 *   - add-commission (for past-papers/past-interviews)
 *   - add-department (for past-papers/past-interviews)
 *   - add-role (for past-papers/past-interviews)
 *   - add-category (for mcqs)
 *   - add-university (for mock-tests)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, action, data } = body;

    if (!type || !action || !data) {
      return NextResponse.json(
        { error: 'Type, action, and data are required' },
        { status: 400 }
      );
    }

    // Get file path
    let filePath;
    switch (type) {
      case 'past-papers':
        filePath = path.join(CATEGORIES_DIR, 'pastPapersCategories.js');
        break;
      case 'past-interviews':
        filePath = path.join(CATEGORIES_DIR, 'pastInterviewsCategories.js');
        break;
      case 'mcqs':
        filePath = path.join(CATEGORIES_DIR, 'mcqsCategories.js');
        break;
      case 'mock-tests':
        filePath = path.join(CATEGORIES_DIR, 'mockTestCategories.js');
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    // Read current file
    let fileContent = await fs.readFile(filePath, 'utf-8');
    let updated = false;

    // Update file based on action
    if (action === 'add-commission' && (type === 'past-papers' || type === 'past-interviews')) {
      const { title, icon = 'Building2' } = data;
      
      // Check if icon needs to be imported
      const iconImportMatch = fileContent.match(/import\s+{([^}]+)}\s+from\s+["']lucide-react["']/);
      if (iconImportMatch && !iconImportMatch[1].includes(icon)) {
        const imports = iconImportMatch[1].trim();
        fileContent = fileContent.replace(
          iconImportMatch[0],
          `import { ${imports}, ${icon} } from "lucide-react"`
        );
      }

      // Find where to insert new commission
      const commissionEntry = `  {
    title: "${title}",
    icon: ${icon},
    departments: []
  }`;

      // Insert before the closing bracket of the array
      const arrayCloseMatch = fileContent.match(/^(\s+})(\s*];)/m);
      if (arrayCloseMatch) {
        const insertPos = arrayCloseMatch.index;
        const beforeInsert = fileContent.substring(0, insertPos);
        
        // Check if there are existing commissions (add comma if needed)
        const lastCommissionMatch = beforeInsert.match(/(\s+})\s*$/m);
        if (lastCommissionMatch) {
          // Add comma before new commission
          const beforeLast = fileContent.substring(0, lastCommissionMatch.index + lastCommissionMatch[0].length);
          const afterLast = fileContent.substring(lastCommissionMatch.index + lastCommissionMatch[0].length);
          fileContent = beforeLast + ',\n' + commissionEntry + afterLast;
          updated = true;
        }
      }
    } else if (action === 'add-department' && (type === 'past-papers' || type === 'past-interviews')) {
      const { commissionTitle, departmentLabel } = data;
      
      // Find the commission and add department
      const commissionRegex = new RegExp(
        `(title:\\s*["']${commissionTitle}["'][^}]*departments:\\s*\\[)([^\\]]*)(\\])`,
        's'
      );
      
      const match = fileContent.match(commissionRegex);
      if (match) {
        const beforeDepts = match[1];
        const existingDepts = match[2];
        const afterDepts = match[3];
        
        const newDept = existingDepts.trim() 
          ? `,\n      {
        label: "${departmentLabel}",
        roles: []
      }`
          : `      {
        label: "${departmentLabel}",
        roles: []
      }`;
        
        fileContent = fileContent.replace(
          commissionRegex,
          beforeDepts + existingDepts + newDept + afterDepts
        );
        updated = true;
      }
    } else if (action === 'add-role' && (type === 'past-papers' || type === 'past-interviews')) {
      const { commissionTitle, departmentLabel, roleLabel, roleLink } = data;
      
      // Find the department and add role
      const deptRegex = new RegExp(
        `(label:\\s*["']${departmentLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^}]*roles:\\s*\\[)([^\\]]*)(\\])`,
        's'
      );
      
      const match = fileContent.match(deptRegex);
      if (match) {
        const beforeRoles = match[1];
        const existingRoles = match[2];
        const afterRoles = match[3];
        
        const newRole = existingRoles.trim()
          ? `,\n          { label: "${roleLabel}", link: "${roleLink}" }`
          : `          { label: "${roleLabel}", link: "${roleLink}" }`;
        
        fileContent = fileContent.replace(
          deptRegex,
          beforeRoles + existingRoles + newRole + afterRoles
        );
        updated = true;
      }
    } else if (action === 'add-category' && type === 'mcqs') {
      const { value, label } = data;
      
      // Find the mcqCategories array and add new category
      const arrayRegex = /(export\s+const\s+mcqCategories\s*=\s*\[)([^\]]*)(\])/s;
      const match = fileContent.match(arrayRegex);
      
      if (match) {
        const beforeArray = match[1];
        const existingItems = match[2];
        const afterArray = match[3];
        
        const newCategory = existingItems.trim()
          ? `,\n  { "value": "${value}", "label": "${label}" }`
          : `  { "value": "${value}", "label": "${label}" }`;
        
        fileContent = fileContent.replace(
          arrayRegex,
          beforeArray + existingItems + newCategory + afterArray
        );
        updated = true;
      }
    } else if (action === 'add-university' && type === 'mock-tests') {
      const { label, full, slug } = data;
      
      // Find the UNIVERSITIES array and add new university
      const arrayRegex = /(export\s+const\s+UNIVERSITIES\s*=\s*\[)([^\]]*)(\])/s;
      const match = fileContent.match(arrayRegex);
      
      if (match) {
        const beforeArray = match[1];
        const existingItems = match[2];
        const afterArray = match[3];
        
        const newUniversity = existingItems.trim()
          ? `,\n  { label: '${label}', full: '${full}', slug: '${slug}' }`
          : `  { label: '${label}', full: '${full}', slug: '${slug}' }`;
        
        fileContent = fileContent.replace(
          arrayRegex,
          beforeArray + existingItems + newUniversity + afterArray
        );
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(filePath, fileContent, 'utf-8');
      return NextResponse.json({
        success: true,
        message: 'Category file updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update category file. Check data format.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating category file:', error);
    return NextResponse.json(
      { error: 'Failed to update category file', details: error.message },
      { status: 500 }
    );
  }
}

