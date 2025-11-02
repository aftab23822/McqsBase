/**
 * API Route for Bulk Category Structure Updates
 * 
 * This endpoint allows saving the entire category structure at once
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CATEGORIES_DIR = path.join(process.cwd(), 'src', 'data', 'categories');

/**
 * PUT - Save entire category structure
 * Body: { type, structure }
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { type, structure } = body;

    if (!type || !structure) {
      return NextResponse.json(
        { error: 'Type and structure are required' },
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

    // Read current file to get the imports and function structure
    const currentFile = await fs.readFile(filePath, 'utf-8');
    
    // Extract imports
    const importMatch = currentFile.match(/import\s+{[^}]+}\s+from\s+["']lucide-react["']/);
    const imports = importMatch ? importMatch[0] : 'import { Building2 } from "lucide-react";';
    
    // Generate new file content based on type
    let newFileContent = '';
    
    if (type === 'mcqs') {
      // MCQs categories
      const categories = structure.categories || [];
      newFileContent = `/**
 * MCQ Categories Configuration
 * 
 * This file contains all MCQ categories organized by subject type.
 * Edit this file directly to add, remove, or modify MCQ categories.
 */

export const mcqCategories = [
${categories.map(cat => `  { "value": "${cat.value}", "label": "${cat.label}" }`).join(',\n')}
];

/**
 * Get all MCQ categories (sorted alphabetically)
 */
export function getMcqCategories() {
  return [...mcqCategories].sort((a, b) => 
    a.label.localeCompare(b.label)
  );
}
`;
    } else if (type === 'past-papers' || type === 'past-interviews') {
      // Hierarchical structure
      const commissions = structure.commissions || [];
      
      // Collect all unique icons - extract icon names from strings
      const icons = new Set(['Building2', 'Landmark', 'MapPin']);
      commissions.forEach(c => {
        let iconName = 'Building2';
        if (typeof c.icon === 'string') {
          iconName = c.icon;
        } else if (c.icon && typeof c.icon === 'function') {
          // React component - extract name from function name
          iconName = c.icon.name || c.icon.displayName || 'Building2';
        } else if (c.icon && typeof c.icon === 'object') {
          iconName = c.icon.name || c.icon.displayName || 'Building2';
        }
        icons.add(iconName);
      });
      
      const iconList = Array.from(icons).sort().join(', ');
      
      newFileContent = `/**
 * ${type === 'past-papers' ? 'Past Paper' : 'Past Interview'} Categories Configuration
 * 
 * This file contains all ${type === 'past-papers' ? 'Past Paper' : 'Past Interview'} categories organized by commission (SPSC, FPSC, etc.)
 * Edit this file directly to add, remove, or modify ${type === 'past-papers' ? 'Past Paper' : 'Past Interview'} categories.
 * 
 * Structure:
 * - Commission (SPSC, FPSC, etc.)
 *   - Departments (e.g., College Education Department, Health Department)
 *     - Roles (e.g., Lecturer Computer Science BPS-17, Medical Officer BPS-17)
 */

import { ${iconList} } from "lucide-react";

export const ${type === 'past-papers' ? 'pastPaperCategories' : 'pastInterviewCategories'} = [
${commissions.map(comm => {
  // Extract icon name - should already be a string from API
  let iconName = 'Building2';
  if (typeof comm.icon === 'string') {
    iconName = comm.icon;
  } else if (comm.icon && typeof comm.icon === 'function') {
    iconName = comm.icon.name || comm.icon.displayName || 'Building2';
  } else if (comm.icon && typeof comm.icon === 'object') {
    iconName = comm.icon.name || comm.icon.displayName || 'Building2';
  }
  return `  {
    title: "${comm.title.replace(/"/g, '\\"')}",
    icon: ${iconName},
    departments: [
${comm.departments?.map(dept => {
  return `      {
        label: "${dept.label.replace(/"/g, '\\"')}",
        roles: [
${dept.roles?.map(role => {
  return `          { label: "${role.label.replace(/"/g, '\\"')}", link: "${role.link}" }`;
}).join(',\n')}
        ]
      }`;
}).join(',\n')}
    ]
  }`;
}).join(',\n')}
];

/**
 * Helper function to sort departments alphabetically within each commission
 */
export function sort${type === 'past-papers' ? 'PastPaper' : 'PastInterview'}Categories() {
  return ${type === 'past-papers' ? 'pastPaperCategories' : 'pastInterviewCategories'}.map(commission => ({
    ...commission,
    departments: [...commission.departments].sort((a, b) => {
      // Remove emoji for sorting
      const labelA = a.label.replace(/^[^\\w\\s]+/, '').trim();
      const labelB = b.label.replace(/^[^\\w\\s]+/, '').trim();
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
 * Get all ${type === 'past-papers' ? 'Past Paper' : 'Past Interview'} categories (sorted)
 */
export function get${type === 'past-papers' ? 'PastPaper' : 'PastInterview'}Categories() {
  return sort${type === 'past-papers' ? 'PastPaper' : 'PastInterview'}Categories();
}
`;
    }

    // Write the new file
    await fs.writeFile(filePath, newFileContent, 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: 'Category structure saved successfully'
    });

  } catch (error) {
    console.error('Error saving category structure:', error);
    return NextResponse.json(
      { error: 'Failed to save category structure', details: error.message },
      { status: 500 }
    );
  }
}

