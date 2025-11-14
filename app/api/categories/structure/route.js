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
 *   - add-subcategory (for past-papers/past-interviews) - supports nested subcategories
 *   - edit-subcategory (for past-papers/past-interviews) - edit existing subcategory
 *   - delete-subcategory (for past-papers/past-interviews) - delete subcategory
 *   - reorder-subcategory (for past-papers/past-interviews) - reorder subcategories
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
          ? `,\n          { label: "${roleLabel}", link: "${roleLink}", subcategories: [] }`
          : `          { label: "${roleLabel}", link: "${roleLink}", subcategories: [] }`;
        
        fileContent = fileContent.replace(
          deptRegex,
          beforeRoles + existingRoles + newRole + afterRoles
        );
        updated = true;
      }
    } else if (action === 'add-subcategory' && (type === 'past-papers' || type === 'past-interviews')) {
      const { commissionTitle, departmentLabel, roleLabel, subcategoryLabel, subcategoryLink, parentSubcategoryPath } = data;
      
      // Generate link from label if not provided
      let finalLink = subcategoryLink.trim();
      if (!finalLink) {
        // Generate slug from label
        const slug = subcategoryLabel.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Find the role to get its link
        const escapedRoleLabel = roleLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const roleLinkMatch = fileContent.match(new RegExp(`label:\\s*["']${escapedRoleLabel}["'][^}]*link:\\s*["']([^"]*)["']`, 's'));
        const roleLink = roleLinkMatch ? roleLinkMatch[1] : '';
        
        finalLink = roleLink ? `${roleLink}/${slug}` : `/${type === 'past-papers' ? 'past-papers' : 'past-interviews'}/${slug}`;
      }
      
      // Escape special characters in roleLabel for regex
      const escapedRoleLabel = roleLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Find the role - handle both cases: with and without subcategories array
      // Pattern 1: Role with subcategories array
      let roleRegex = new RegExp(
        `(label:\\s*["']${escapedRoleLabel}["'][^}]*link:\\s*["'][^"]*["'][^}]*subcategories:\\s*\\[)([^\\]]*)(\\])`,
        's'
      );
      
      let match = fileContent.match(roleRegex);
      
      // Pattern 2: Role without subcategories array (need to add it)
      if (!match) {
        roleRegex = new RegExp(
          `(label:\\s*["']${escapedRoleLabel}["'][^}]*link:\\s*["']([^"]*)["'])(\\s*)(\\})`,
          's'
        );
        match = fileContent.match(roleRegex);
        
        if (match) {
          // Add subcategories array to role
          const beforeLink = match[1]; // Everything up to closing quote
          const roleLink = match[2];
          const whitespace = match[3]; // Whitespace before closing brace
          const closingBrace = match[4]; // The closing brace
          
          const newSubcat = `,\n            subcategories: [\n            { label: "${subcategoryLabel}", link: "${finalLink}", subcategories: [] }\n          ]`;
          
          fileContent = fileContent.replace(
            roleRegex,
            beforeLink + newSubcat + whitespace + closingBrace
          );
          updated = true;
        }
      } else {
        // Role already has subcategories array
        const beforeSubcats = match[1];
        const existingSubcats = match[2];
        const afterSubcats = match[3];
        
        const newSubcat = existingSubcats.trim()
          ? `,\n            { label: "${subcategoryLabel}", link: "${finalLink}", subcategories: [] }`
          : `            { label: "${subcategoryLabel}", link: "${finalLink}", subcategories: [] }`;
        
        fileContent = fileContent.replace(
          roleRegex,
          beforeSubcats + existingSubcats + newSubcat + afterSubcats
        );
        updated = true;
      }
      
      // TODO: Handle nested subcategories (parentSubcategoryPath) - requires more complex parsing
      // For now, nested subcategories are added to the role's direct subcategories
    } else if (action === 'edit-subcategory' && (type === 'past-papers' || type === 'past-interviews')) {
      const { commissionTitle, departmentLabel, roleLabel, subcategoryIndex, subcategoryLabel, subcategoryLink } = data;
      
      if (!roleLabel || subcategoryIndex === undefined || !subcategoryLabel) {
        return NextResponse.json(
          { error: 'Missing required fields: roleLabel, subcategoryIndex, or subcategoryLabel' },
          { status: 400 }
        );
      }
      
      const escapedRoleLabel = roleLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Find the role object first - handle multiline format
      const roleMatch = fileContent.match(new RegExp(
        `label:\\s*["']${escapedRoleLabel}["'][\\s\\S]*?link:\\s*["']([^"']*)["']`,
        's'
      ));
      
      if (!roleMatch) {
        return NextResponse.json(
          { error: `Role not found: ${roleLabel}` },
          { status: 400 }
        );
      }
      
      // Find subcategories array in the role - need to handle nested brackets
      const roleStart = roleMatch.index;
      const afterRoleStart = roleMatch.index + roleMatch[0].length;
      const subcatsMatch = fileContent.substring(afterRoleStart).match(/subcategories:\s*\[/);
      
      if (!subcatsMatch) {
        return NextResponse.json(
          { error: 'Subcategories array not found' },
          { status: 400 }
        );
      }
      
      const subcatsArrayStart = afterRoleStart + subcatsMatch.index + subcatsMatch[0].length;
      
      // Find the matching closing bracket by counting
      let bracketDepth = 1;
      let bracketEnd = -1;
      for (let i = subcatsArrayStart; i < fileContent.length; i++) {
        if (fileContent[i] === '[') bracketDepth++;
        else if (fileContent[i] === ']') {
          bracketDepth--;
          if (bracketDepth === 0) {
            bracketEnd = i;
            break;
          }
        }
      }
      
      if (bracketEnd === -1) {
        return NextResponse.json(
          { error: 'Could not find closing bracket for subcategories array' },
          { status: 400 }
        );
      }
      
      const subcatsContent = fileContent.substring(subcatsArrayStart, bracketEnd);
      
      // Parse subcategories by counting braces
      const parseSubcategories = (str) => {
        const subcats = [];
        let depth = 0;
        let start = -1;
        
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (str[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
              subcats.push({
                text: str.substring(start, i + 1),
                start: start,
                end: i + 1
              });
              start = -1;
            }
          }
        }
        return subcats;
      };
      
      const subcats = parseSubcategories(subcatsContent);
      
      if (!subcats[subcategoryIndex]) {
        return NextResponse.json(
          { error: `Subcategory at index ${subcategoryIndex} not found` },
          { status: 400 }
        );
      }
      
      const oldSubcat = subcats[subcategoryIndex];
      
      // Extract nested subcategories from the old subcategory
      let nestedSubcats = '';
      const nestedSubcatsMatch = oldSubcat.text.match(/subcategories:\s*\[/);
      if (nestedSubcatsMatch) {
        const nestedStart = oldSubcat.text.indexOf('[', nestedSubcatsMatch.index);
        let nestedDepth = 1;
        for (let i = nestedStart + 1; i < oldSubcat.text.length; i++) {
          if (oldSubcat.text[i] === '[') nestedDepth++;
          else if (oldSubcat.text[i] === ']') {
            nestedDepth--;
            if (nestedDepth === 0) {
              nestedSubcats = oldSubcat.text.substring(nestedStart + 1, i).trim();
              break;
            }
          }
        }
      }
      
      // Generate link if not provided
      let finalLink = subcategoryLink.trim();
      if (!finalLink) {
        const slug = subcategoryLabel.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Extract role link from the role object
        const roleLinkMatch = roleMatch[0].match(/link:\s*["']([^"']*)["']/);
        const roleLink = roleLinkMatch ? roleLinkMatch[1] : '';
        finalLink = roleLink ? `${roleLink}/${slug}` : `/${type === 'past-papers' ? 'past-papers' : 'past-interviews'}/${slug}`;
      }
      
      // Build new subcategory with updated label and link
      const newSubcat = `{ label: "${subcategoryLabel}", link: "${finalLink}"${nestedSubcats ? `, subcategories: [${nestedSubcats}]` : ', subcategories: []'}}`;
      
      // Replace the old subcategory in the file
      let beforeSubcat = subcatsContent.substring(0, oldSubcat.start);
      let afterSubcat = subcatsContent.substring(oldSubcat.end);
      
      // Clean up commas - remove trailing comma from before, leading comma from after
      beforeSubcat = beforeSubcat.trim();
      afterSubcat = afterSubcat.trim();
      
      // Remove comma at the end of beforeSubcat if it exists
      beforeSubcat = beforeSubcat.replace(/,\s*$/, '');
      // Remove comma at the start of afterSubcat if it exists
      afterSubcat = afterSubcat.replace(/^\s*,/, '');
      
      // Build the new content with proper comma placement
      let newSubcatsContent = '';
      if (beforeSubcat && afterSubcat) {
        // Subcategory in the middle
        newSubcatsContent = beforeSubcat + ',\n            ' + newSubcat + ',\n            ' + afterSubcat;
      } else if (beforeSubcat) {
        // Subcategory is the last one
        newSubcatsContent = beforeSubcat + ',\n            ' + newSubcat;
      } else if (afterSubcat) {
        // Subcategory is the first one
        newSubcatsContent = newSubcat + ',\n            ' + afterSubcat;
      } else {
        // Only one subcategory
        newSubcatsContent = newSubcat;
      }
      
      // Reconstruct the file
      const beforeSubcatsArray = fileContent.substring(0, subcatsArrayStart);
      const afterSubcatsArray = fileContent.substring(bracketEnd);
      
      fileContent = beforeSubcatsArray + newSubcatsContent + afterSubcatsArray;
      updated = true;
    } else if (action === 'delete-subcategory' && (type === 'past-papers' || type === 'past-interviews')) {
      const { commissionTitle, departmentLabel, roleLabel, subcategoryIndex } = data;
      
      if (!roleLabel || subcategoryIndex === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: roleLabel or subcategoryIndex' },
          { status: 400 }
        );
      }
      
      const escapedRoleLabel = roleLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Find the role object first - handle multiline format
      const roleMatch = fileContent.match(new RegExp(
        `label:\\s*["']${escapedRoleLabel}["'][\\s\\S]*?link:\\s*["']([^"']*)["']`,
        's'
      ));
      
      if (!roleMatch) {
        return NextResponse.json(
          { error: `Role not found: ${roleLabel}` },
          { status: 400 }
        );
      }
      
      // Find subcategories array in the role - need to handle nested brackets
      const roleStart = roleMatch.index;
      const afterRoleStart = roleMatch.index + roleMatch[0].length;
      const subcatsMatch = fileContent.substring(afterRoleStart).match(/subcategories:\s*\[/);
      
      if (!subcatsMatch) {
        return NextResponse.json(
          { error: 'Subcategories array not found' },
          { status: 400 }
        );
      }
      
      const subcatsArrayStart = afterRoleStart + subcatsMatch.index + subcatsMatch[0].length;
      
      // Find the matching closing bracket by counting
      let bracketDepth = 1;
      let bracketEnd = -1;
      for (let i = subcatsArrayStart; i < fileContent.length; i++) {
        if (fileContent[i] === '[') bracketDepth++;
        else if (fileContent[i] === ']') {
          bracketDepth--;
          if (bracketDepth === 0) {
            bracketEnd = i;
            break;
          }
        }
      }
      
      if (bracketEnd === -1) {
        return NextResponse.json(
          { error: 'Could not find closing bracket for subcategories array' },
          { status: 400 }
        );
      }
      
      const subcatsContent = fileContent.substring(subcatsArrayStart, bracketEnd);
      
      // Parse subcategories by counting braces
      const parseSubcategories = (str) => {
        const subcats = [];
        let depth = 0;
        let start = -1;
        
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (str[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
              subcats.push({
                text: str.substring(start, i + 1),
                start: start,
                end: i + 1
              });
              start = -1;
            }
          }
        }
        return subcats;
      };
      
      const subcats = parseSubcategories(subcatsContent);
      
      if (!subcats[subcategoryIndex]) {
        return NextResponse.json(
          { error: `Subcategory at index ${subcategoryIndex} not found` },
          { status: 400 }
        );
      }
      
      const toRemove = subcats[subcategoryIndex];
      
      // Remove the subcategory and clean up commas
      let beforeSubcat = subcatsContent.substring(0, toRemove.start).trim();
      let afterSubcat = subcatsContent.substring(toRemove.end).trim();
      
      // Remove trailing comma from before, leading comma from after
      beforeSubcat = beforeSubcat.replace(/,\s*$/, '');
      afterSubcat = afterSubcat.replace(/^\s*,/, '');
      
      // Combine remaining subcategories
      let newSubcats = '';
      if (beforeSubcat && afterSubcat) {
        newSubcats = beforeSubcat + ',\n            ' + afterSubcat;
      } else if (beforeSubcat) {
        newSubcats = beforeSubcat;
      } else if (afterSubcat) {
        newSubcats = afterSubcat;
      }
      newSubcats = newSubcats.trim();
      
      // Reconstruct the file
      const beforeSubcatsArray = fileContent.substring(0, subcatsArrayStart);
      const afterSubcatsArray = fileContent.substring(bracketEnd);
      
      if (!newSubcats) {
        // Remove the entire subcategories property
        // Find where subcategories: starts and remove it along with the array
        const subcatsPropStart = afterRoleStart + subcatsMatch.index;
        const beforeSubcatsProp = fileContent.substring(0, subcatsPropStart);
        const afterSubcatsProp = fileContent.substring(bracketEnd + 1);
        
        // Check if there's a comma before subcategories: and remove it
        // Also remove any whitespace/newlines before subcategories:
        let cleanedBefore = beforeSubcatsProp;
        // Remove trailing comma and whitespace
        cleanedBefore = cleanedBefore.replace(/,\s*$/, '');
        // Also handle case where subcategories might be on a new line
        cleanedBefore = cleanedBefore.replace(/,\s*\n\s*$/, '');
        
        fileContent = cleanedBefore + afterSubcatsProp;
      } else {
        // Update with remaining subcategories
        fileContent = beforeSubcatsArray + newSubcats + afterSubcatsArray;
      }
      
      updated = true;
    } else if (action === 'reorder-subcategory' && (type === 'past-papers' || type === 'past-interviews')) {
      const { commissionTitle, departmentLabel, roleLabel, fromIndex, toIndex } = data;
      
      const escapedRoleLabel = roleLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const roleRegex = new RegExp(
        `(label:\\s*["']${escapedRoleLabel}["'][^}]*link:\\s*["'][^"]*["'][^}]*subcategories:\\s*\\[)([^\\]]*)(\\])`,
        's'
      );
      
      const match = fileContent.match(roleRegex);
      if (match) {
        const beforeSubcats = match[1];
        const existingSubcats = match[2];
        const afterSubcats = match[3];
        
        // Parse subcategories by counting braces to handle nested structures
        const parseSubcategories = (str) => {
          const subcats = [];
          let depth = 0;
          let start = -1;
          
          for (let i = 0; i < str.length; i++) {
            if (str[i] === '{') {
              if (depth === 0) start = i;
              depth++;
            } else if (str[i] === '}') {
              depth--;
              if (depth === 0 && start !== -1) {
                subcats.push(str.substring(start, i + 1));
                start = -1;
              }
            }
          }
          return subcats;
        };
        
        const subcats = parseSubcategories(existingSubcats);
        
        if (subcats[fromIndex] !== undefined && subcats[toIndex] !== undefined && fromIndex !== toIndex) {
          // Reorder: move fromIndex to toIndex
          const [moved] = subcats.splice(fromIndex, 1);
          subcats.splice(toIndex, 0, moved);
          
          // Reconstruct the subcategories string with proper formatting
          const newSubcats = subcats.map((sc, idx) => {
            const trimmed = sc.trim();
            return idx === 0 ? trimmed : `,\n            ${trimmed}`;
          }).join('');
          
          fileContent = fileContent.replace(
            roleRegex,
            beforeSubcats + newSubcats + afterSubcats
          );
          updated = true;
        }
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

