/**
 * Pure mutations for category structure payloads (JSON objects, not file AST).
 */

function generateSlug(label) {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findCommission(commissions, title) {
  return commissions?.find((c) => c.title === title);
}

function findDepartment(commission, departmentLabel) {
  return commission?.departments?.find((d) => d.label === departmentLabel);
}

function findRole(department, roleLabel) {
  return department?.roles?.find((r) => r.label === roleLabel);
}

function getRole(payload, commissionTitle, departmentLabel, roleLabel) {
  const comm = findCommission(payload.commissions, commissionTitle);
  if (!comm) throw new Error(`Commission "${commissionTitle}" not found`);
  const dept = findDepartment(comm, departmentLabel);
  if (!dept) throw new Error(`Department "${departmentLabel}" not found`);
  const role = findRole(dept, roleLabel);
  if (!role) throw new Error(`Role "${roleLabel}" not found`);
  return role;
}

/**
 * Subcategories array where new children are added (matches AST navigateToSubcategory + add).
 */
function getArrayForAddingChild(role, pathToParentSubcategory) {
  const path = Array.isArray(pathToParentSubcategory) ? pathToParentSubcategory : [];
  if (path.length === 0) {
    if (!role.subcategories) role.subcategories = [];
    return role.subcategories;
  }
  let node = role;
  for (let i = 0; i < path.length; i++) {
    const idx = path[i];
    if (!node.subcategories?.[idx]) {
      throw new Error(`Invalid parent subcategory path at index ${i}`);
    }
    node = node.subcategories[idx];
  }
  if (!node.subcategories) node.subcategories = [];
  return node.subcategories;
}

function getJsonSubcategoryLink(role, pathIndices) {
  if (!pathIndices?.length) {
    return role.link || '';
  }
  let node = role;
  for (let i = 0; i < pathIndices.length; i++) {
    const idx = pathIndices[i];
    if (!node.subcategories?.[idx]) return '';
    node = node.subcategories[idx];
  }
  return node.link || '';
}

/**
 * Direct subcategories of role (top level only) — used for reorder.
 */
function getTopLevelSubcategories(role) {
  if (!role.subcategories) role.subcategories = [];
  return role.subcategories;
}

function getSubcategoriesArrayByParentPath(role, parentPath) {
  const path = Array.isArray(parentPath) ? parentPath : [];
  if (path.length === 0) {
    if (!role.subcategories) role.subcategories = [];
    return role.subcategories;
  }
  let node = role;
  for (let i = 0; i < path.length; i++) {
    const idx = path[i];
    if (!node.subcategories?.[idx]) {
      throw new Error(`Invalid parent path at index ${i}`);
    }
    node = node.subcategories[idx];
  }
  if (!node.subcategories) node.subcategories = [];
  return node.subcategories;
}

export function applyCategoryStructureMutation(payload, type, action, data) {
  const baseType = type;

  if (action === 'add-commission' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const { title, icon = 'Building2' } = data;
    if (!title) throw new Error('Commission title is required');
    if (!payload.commissions) payload.commissions = [];
    payload.commissions.push({
      title,
      icon,
      departments: [],
    });
    return payload;
  }

  if (action === 'add-department' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const { commissionTitle, departmentLabel } = data;
    const comm = findCommission(payload.commissions, commissionTitle);
    if (!comm) throw new Error(`Commission "${commissionTitle}" not found`);
    if (!comm.departments) comm.departments = [];
    comm.departments.push({
      label: departmentLabel,
      roles: [],
    });
    return payload;
  }

  if (action === 'add-role' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const { commissionTitle, departmentLabel, roleLabel, roleLink } = data;
    const comm = findCommission(payload.commissions, commissionTitle);
    if (!comm) throw new Error(`Commission "${commissionTitle}" not found`);
    const dept = findDepartment(comm, departmentLabel);
    if (!dept) throw new Error(`Department "${departmentLabel}" not found`);
    if (!dept.roles) dept.roles = [];
    dept.roles.push({
      label: roleLabel,
      link: roleLink,
      subcategories: [],
    });
    return payload;
  }

  if (action === 'add-subcategory' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const {
      commissionTitle,
      departmentLabel,
      roleLabel,
      subcategoryLabel,
      subcategoryLink,
      parentSubcategoryPath,
    } = data;
    if (!roleLabel || !subcategoryLabel) {
      throw new Error('roleLabel and subcategoryLabel are required');
    }
    const role = getRole(payload, commissionTitle, departmentLabel, roleLabel);
    const normalizedPath = Array.isArray(parentSubcategoryPath)
      ? parentSubcategoryPath
      : parentSubcategoryPath != null
        ? [parentSubcategoryPath]
        : [];

    let finalLink = subcategoryLink?.trim() || '';
    if (!finalLink) {
      let parentLink = '';
      if (normalizedPath.length > 0) {
        parentLink = getJsonSubcategoryLink(role, normalizedPath) || '';
      } else {
        parentLink = role.link || '';
      }
      const slug = generateSlug(subcategoryLabel);
      finalLink = parentLink ? `${parentLink.replace(/\/$/, '')}/${slug}` : slug;
    }

    const targetArr = getArrayForAddingChild(role, normalizedPath);
    targetArr.push({
      label: subcategoryLabel,
      link: finalLink,
      subcategories: [],
    });
    return payload;
  }

  if (action === 'edit-subcategory' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const {
      commissionTitle,
      departmentLabel,
      roleLabel,
      subcategoryIndex,
      subcategoryLabel,
      subcategoryLink,
      parentSubcategoryPath,
    } = data;
    if (roleLabel == null || subcategoryIndex === undefined || !subcategoryLabel) {
      throw new Error('roleLabel, subcategoryIndex, and subcategoryLabel are required');
    }
    const role = getRole(payload, commissionTitle, departmentLabel, roleLabel);
    const parentPath = Array.isArray(parentSubcategoryPath)
      ? parentSubcategoryPath
      : parentSubcategoryPath != null
        ? [parentSubcategoryPath]
        : [];
    const arr = getSubcategoriesArrayByParentPath(role, parentPath);
    if (subcategoryIndex < 0 || subcategoryIndex >= arr.length) {
      throw new Error(`Subcategory index ${subcategoryIndex} is out of range`);
    }
    const existing = arr[subcategoryIndex];
    let finalLink = (subcategoryLink || '').trim();
    if (!finalLink) {
      const slug = generateSlug(subcategoryLabel);
      const roleLinkMatch = role.link || '';
      finalLink = roleLinkMatch
        ? `${roleLinkMatch.replace(/\/$/, '')}/${slug}`
        : `/${baseType === 'past-papers' ? 'past-papers' : 'past-interviews'}/${slug}`;
    }
    arr[subcategoryIndex] = {
      ...existing,
      label: subcategoryLabel,
      link: finalLink,
      subcategories: existing.subcategories || [],
    };
    return payload;
  }

  if (action === 'delete-subcategory' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const { commissionTitle, departmentLabel, roleLabel, subcategoryIndex, parentSubcategoryPath } = data;
    if (roleLabel == null || subcategoryIndex === undefined) {
      throw new Error('roleLabel and subcategoryIndex are required');
    }
    const role = getRole(payload, commissionTitle, departmentLabel, roleLabel);
    const parentPath = Array.isArray(parentSubcategoryPath)
      ? parentSubcategoryPath
      : parentSubcategoryPath != null
        ? [parentSubcategoryPath]
        : [];
    const arr = getSubcategoriesArrayByParentPath(role, parentPath);
    if (subcategoryIndex < 0 || subcategoryIndex >= arr.length) {
      throw new Error(`Subcategory index ${subcategoryIndex} is out of range`);
    }
    arr.splice(subcategoryIndex, 1);
    return payload;
  }

  if (action === 'reorder-subcategory' && (baseType === 'past-papers' || baseType === 'past-interviews')) {
    const { commissionTitle, departmentLabel, roleLabel, fromIndex, toIndex } = data;
    const role = getRole(payload, commissionTitle, departmentLabel, roleLabel);
    const subcats = getTopLevelSubcategories(role);
    if (
      fromIndex === undefined ||
      toIndex === undefined ||
      subcats[fromIndex] === undefined ||
      subcats[toIndex] === undefined ||
      fromIndex === toIndex
    ) {
      throw new Error('Invalid reorder indices');
    }
    const [moved] = subcats.splice(fromIndex, 1);
    subcats.splice(toIndex, 0, moved);
    return payload;
  }

  if (action === 'add-category' && (baseType === 'mcqs' || baseType === 'mock-tests')) {
    const { value, label } = data;
    if (!payload.categories) payload.categories = [];
    payload.categories.push({ value, label });
    return payload;
  }

  if (action === 'add-university' && baseType === 'mock-tests') {
    const { label: uniLabel, full, slug } = data;
    if (!payload.universities) payload.universities = [];
    payload.universities.push({ label: uniLabel, full, slug });
    return payload;
  }

  throw new Error(`Unknown action "${action}" for type "${type}"`);
}
