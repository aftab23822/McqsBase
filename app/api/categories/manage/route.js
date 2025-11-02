/**
 * API Route for Managing Category Files
 * 
 * This endpoint allows reading and updating category configuration files.
 * Supports: mcqs, past-papers, past-interviews
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to category files
const CATEGORIES_DIR = path.join(process.cwd(), 'src', 'data', 'categories');

/**
 * GET - Read category data
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

    let filePath;
    switch (type) {
      case 'mcqs':
        filePath = path.join(CATEGORIES_DIR, 'mcqsCategories.js');
        break;
      case 'past-papers':
        filePath = path.join(CATEGORIES_DIR, 'pastPapersCategories.js');
        break;
      case 'past-interviews':
        filePath = path.join(CATEGORIES_DIR, 'pastInterviewsCategories.js');
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

    // Read the file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // For now, return a success response - we'll parse the actual content in the client
    // Or we could parse it here and return the JSON structure
    return NextResponse.json({
      success: true,
      type,
      filePath,
      // Note: Returning raw file content would expose the full file structure
      // Better to return parsed data or let client read via imports
    });

  } catch (error) {
    console.error('Error reading category file:', error);
    return NextResponse.json(
      { error: 'Failed to read category file', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Update category data
 * Body: { type, action, data }
 * Actions: add-commission, add-department, add-role, add-category (for MCQs)
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
    
    // Parse and update based on action
    // Note: This is a simplified approach. For production, consider using AST parsing
    // For now, we'll use regex-based string manipulation which works for our structure
    
    let updated = false;
    let newContent = fileContent;

    if (action === 'add-commission' && (type === 'past-papers' || type === 'past-interviews')) {
      // Add a new commission
      const { title, icon } = data;
      const iconImport = icon || 'Building2';
      
      // Check if icon is already imported
      if (!fileContent.includes(iconImport)) {
        // Add icon to imports (simple approach)
        const importMatch = fileContent.match(/import\s+{([^}]+)}\s+from\s+["']lucide-react["']/);
        if (importMatch) {
          const imports = importMatch[1].trim();
          if (!imports.includes(iconImport)) {
            newContent = newContent.replace(
              importMatch[0],
              `import { ${imports}, ${iconImport} } from "lucide-react"`
            );
          }
        }
      }

      // Add new commission before the closing bracket
      const commissionEntry = `  {
    title: "${title}",
    icon: ${iconImport},
    departments: []
  }`;
      
      // Find the last commission entry and add after it
      const lastCommissionMatch = newContent.match(/(\s+}\s*]\s*;)/s);
      if (lastCommissionMatch) {
        const beforeLast = newContent.substring(0, lastCommissionMatch.index);
        const lastMatch = beforeLast.match(/(\s+})\s*$/m);
        if (lastMatch) {
          const insertPos = lastMatch.index + lastMatch[0].length;
          newContent = newContent.substring(0, insertPos) + 
                      ',\n' + commissionEntry +
                      newContent.substring(insertPos);
          updated = true;
        }
      }
    }

    if (updated) {
      await fs.writeFile(filePath, newContent, 'utf-8');
      return NextResponse.json({
        success: true,
        message: 'Category file updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Update operation not implemented or failed' },
        { status: 501 }
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

