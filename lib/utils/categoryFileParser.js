/**
 * Robust Category File Parser using Babel AST
 * This module provides reliable parsing and manipulation of category JavaScript files
 */

import parser from '@babel/parser';
import _generate from '@babel/generator';
import _traverse from '@babel/traverse';
import * as t from '@babel/types';

// Fix for Next.js/Webpack - these packages need to be accessed correctly
const generate = _generate.default || _generate;
const traverse = _traverse.default || _traverse;

/**
 * Parse a JavaScript file and return its AST
 */
export function parseCategoryFile(content) {
  try {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
    });
    return ast;
  } catch (error) {
    throw new Error(`Failed to parse category file: ${error.message}`);
  }
}

/**
 * Generate JavaScript code from AST
 */
export function generateCode(ast) {
  try {
    const output = generate(ast, {
      retainLines: false,
      compact: false,
      comments: true,
      jsescOption: {
        quotes: 'double',
        wrap: true,
      },
    });
    return output.code;
  } catch (error) {
    throw new Error(`Failed to generate code: ${error.message}`);
  }
}

/**
 * Navigate to a role object in the AST
 */
export function findRole(ast, commissionTitle, departmentLabel, roleLabel) {
  let foundRole = null;
  let foundRolePath = null;

  traverse(ast, {
    ObjectExpression(path) {
      // Check if this is a commission object
      let isCommission = false;
      let commissionObj = null;
      let departmentObj = null;
      let roleObj = null;

      path.node.properties.forEach((prop) => {
        if (prop.key && prop.key.name === 'title' && prop.value && prop.value.value === commissionTitle) {
          isCommission = true;
          commissionObj = path.node;
        }
      });

      if (isCommission) {
        // Find department
        path.node.properties.forEach((prop) => {
          if (prop.key && prop.key.name === 'departments' && prop.value && prop.value.elements) {
            prop.value.elements.forEach((dept) => {
              if (dept.properties) {
                dept.properties.forEach((deptProp) => {
                  if (deptProp.key && deptProp.key.name === 'label' && deptProp.value && deptProp.value.value === departmentLabel) {
                    departmentObj = dept;
                  }
                });
              }
            });
          }
        });

        if (departmentObj) {
          // Find role
          departmentObj.properties.forEach((prop) => {
            if (prop.key && prop.key.name === 'roles' && prop.value && prop.value.elements) {
              prop.value.elements.forEach((role) => {
                if (role.properties) {
                  role.properties.forEach((roleProp) => {
                    if (roleProp.key && roleProp.key.name === 'label' && roleProp.value && roleProp.value.value === roleLabel) {
                      roleObj = role;
                      foundRole = role;
                      foundRolePath = path;
                    }
                  });
                }
              });
            }
          });
        }
      }
    },
  });

  return { role: foundRole, path: foundRolePath };
}

/**
 * Navigate to a subcategory using a path array
 * Path is an array of indices: [0, 1, 2] means first subcategory, then its second child, then its third child
 */
export function navigateToSubcategory(roleObj, path) {
  if (!path || path.length === 0) {
    return { subcategory: null, subcategoriesArray: null, arrayPath: null };
  }

  let currentArray = null;
  let currentPath = null;

  // Find the subcategories array in the role
  roleObj.properties.forEach((prop) => {
    if (prop.key && prop.key.name === 'subcategories' && prop.value && prop.value.elements) {
      currentArray = prop.value.elements;
      currentPath = prop.value;
    }
  });

  if (!currentArray) {
    return { subcategory: null, subcategoriesArray: null, arrayPath: null };
  }

  // Navigate through the path
  let currentSubcategory = null;
  console.log('[navigateToSubcategory] Starting navigation with path:', JSON.stringify(path), 'array length:', currentArray.length);
  
  for (let i = 0; i < path.length; i++) {
    const idx = path[i];
    console.log(`[navigateToSubcategory] Step ${i}: index=${idx}, array length=${currentArray.length}`);
    
    if (idx < 0 || idx >= currentArray.length) {
      console.log(`[navigateToSubcategory] Invalid index ${idx} at step ${i}`);
      return { subcategory: null, subcategoriesArray: null, arrayPath: null };
    }

    currentSubcategory = currentArray[idx];
    console.log(`[navigateToSubcategory] Step ${i}: Found subcategory at index ${idx}, isLast: ${i === path.length - 1}`);

    // If this is the last index, we've found the target
    if (i === path.length - 1) {
      // Find its subcategories array
      let targetArray = null;
      let targetArrayPath = null;
      
      if (currentSubcategory.properties) {
        currentSubcategory.properties.forEach((prop) => {
          if (prop.key && prop.key.name === 'subcategories' && prop.value) {
            targetArray = prop.value.elements || [];
            targetArrayPath = prop.value;
            console.log(`[navigateToSubcategory] Found subcategories array with ${targetArray.length} elements`);
          }
        });
      } else {
        console.log(`[navigateToSubcategory] Subcategory at path end has no properties`);
      }

      // Get the label of the found subcategory for debugging
      let foundLabel = 'unknown';
      if (currentSubcategory.properties) {
        currentSubcategory.properties.forEach((prop) => {
          if (prop.key && prop.key.name === 'label' && prop.value && prop.value.value) {
            foundLabel = prop.value.value;
          }
        });
      }
      console.log(`[navigateToSubcategory] Returning subcategory (found: ${!!currentSubcategory}, hasArray: ${!!targetArrayPath}, label: "${foundLabel}")`);
      return {
        subcategory: currentSubcategory,
        subcategoriesArray: targetArray,
        arrayPath: targetArrayPath,
      };
    }

    // Otherwise, navigate deeper
    let found = false;
    if (currentSubcategory.properties) {
      currentSubcategory.properties.forEach((prop) => {
        if (prop.key && prop.key.name === 'subcategories' && prop.value && prop.value.elements) {
          currentArray = prop.value.elements;
          currentPath = prop.value;
          found = true;
          console.log(`[navigateToSubcategory] Step ${i}: Navigated deeper, new array length=${currentArray.length}`);
        }
      });
    }

    if (!found) {
      console.log(`[navigateToSubcategory] Step ${i}: No subcategories array found, cannot navigate deeper`);
      return { subcategory: null, subcategoriesArray: null, arrayPath: null };
    }
  }

  return { subcategory: null, subcategoriesArray: null, arrayPath: null };
}

/**
 * Add a subcategory to a subcategories array
 */
export function addSubcategoryToArray(arrayPath, label, link) {
  if (!arrayPath) {
    // Create new array
    arrayPath.elements = t.arrayExpression([
      createSubcategoryObject(label, link),
    ]).elements;
    return;
  }

  if (!arrayPath.elements) {
    arrayPath.elements = [];
  }

  const newSubcategory = createSubcategoryObject(label, link);
  arrayPath.elements.push(newSubcategory);
}

/**
 * Create a subcategory object AST node
 */
function createSubcategoryObject(label, link) {
  return t.objectExpression([
    t.objectProperty(t.identifier('label'), t.stringLiteral(label)),
    t.objectProperty(t.identifier('link'), t.stringLiteral(link)),
    t.objectProperty(
      t.identifier('subcategories'),
      t.arrayExpression([])
    ),
  ]);
}

/**
 * Get the link of a subcategory at a given path
 */
export function getSubcategoryLink(roleObj, path) {
  if (!path || path.length === 0) {
    return null;
  }

  const result = navigateToSubcategory(roleObj, path);
  if (!result.subcategory) {
    return null;
  }

  // Find the link property
  let link = null;
  result.subcategory.properties.forEach((prop) => {
    if (prop.key && prop.key.name === 'link' && prop.value && prop.value.value) {
      link = prop.value.value;
    }
  });

  return link;
}

/**
 * Generate a slug from a label
 */
export function generateSlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

