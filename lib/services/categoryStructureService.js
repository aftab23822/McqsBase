import CategoryStructureConfig from '@/lib/models/CategoryStructureConfig.js';
import { applyCategoryStructureMutation } from '@/lib/services/categoryStructureMutations.js';

export const CATEGORY_STRUCTURE_TYPES = ['mcqs', 'past-papers', 'past-interviews', 'mock-tests'];

function cloneDeep(obj) {
  return structuredClone(obj);
}

function commissionIconToString(comm) {
  let iconName = 'Building2';
  if (typeof comm.icon === 'string') {
    iconName = comm.icon;
  } else if (comm.icon && typeof comm.icon === 'function') {
    iconName = comm.icon.name || comm.icon.displayName || 'Building2';
  } else if (comm.icon && typeof comm.icon === 'object') {
    iconName = comm.icon.name || comm.icon.displayName || 'Building2';
  }
  return { ...comm, icon: iconName };
}

function sortCommissionsPayload(commissions) {
  if (!Array.isArray(commissions)) return [];
  return commissions.map((commission) => ({
    ...commission,
    departments: [...(commission.departments || [])]
      .sort((a, b) => {
        const labelA = String(a.label || '').replace(/^[^\w\s]+/, '').trim();
        const labelB = String(b.label || '').replace(/^[^\w\s]+/, '').trim();
        return labelA.localeCompare(labelB);
      })
      .map((dept) => ({
        ...dept,
        roles: dept.roles
          ? [...dept.roles].filter((r) => r && r.label).sort((a, b) => String(a?.label || '').localeCompare(String(b?.label || '')))
          : [],
      })),
  }));
}

function normalizePastPayloadForApi(rawCommissions) {
  const withStringIcons = (rawCommissions || []).map(commissionIconToString);
  return { commissions: sortCommissionsPayload(withStringIcons) };
}

function dedupeBy(items, getKey) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeMockTestsPayloadForApi(rawPayload) {
  const categories = dedupeBy(rawPayload.categories || [], (category) => category?.value);
  const topLevelCategoryValues = new Set(
    categories
      .filter((category) => category.value && category.value !== 'universities')
      .map((category) => category.value)
  );
  const universities = dedupeBy(rawPayload.universities || [], (university) => university?.slug)
    .filter((university) => !topLevelCategoryValues.has(university.slug))
    .sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')));

  return { categories, universities };
}

async function loadStaticCategoryData(type) {
  switch (type) {
    case 'mcqs': {
      const mcqsModule = await import('../../src/data/categories/mcqsCategories.js');
      const categories = mcqsModule.getMcqCategories
        ? mcqsModule.getMcqCategories()
        : mcqsModule.mcqCategories || [];
      return { categories: cloneDeep(categories) };
    }
    case 'past-papers': {
      const mod = await import('../../src/data/categories/pastPapersCategories.js');
      const raw = mod.getPastPaperCategories ? mod.getPastPaperCategories() : mod.pastPaperCategories || [];
      return normalizePastPayloadForApi(raw);
    }
    case 'past-interviews': {
      const mod = await import('../../src/data/categories/pastInterviewsCategories.js');
      const raw = mod.getPastInterviewCategories ? mod.getPastInterviewCategories() : mod.pastInterviewCategories || [];
      return normalizePastPayloadForApi(raw);
    }
    case 'mock-tests': {
      const mod = await import('../../src/data/categories/mockTestCategories.js');
      const categories = mod.getMockTestCategories
        ? mod.getMockTestCategories()
        : mod.MOCK_TEST_CATEGORIES || [];
      const universities = mod.getUniversities ? mod.getUniversities() : mod.UNIVERSITIES || [];
      return normalizeMockTestsPayloadForApi({
        categories: cloneDeep(categories),
        universities: cloneDeep(universities),
      });
    }
    default:
      throw new Error(`Invalid category structure type: ${type}`);
  }
}

/**
 * Merged API `data` object: DB override when present, else static files.
 */
export async function getMergedCategoryData(type) {
  if (!CATEGORY_STRUCTURE_TYPES.includes(type)) {
    throw new Error(`Invalid type parameter: ${type}`);
  }

  const doc = await CategoryStructureConfig.findOne({ structureKey: type }).lean();
  if (doc?.payload) {
    const p = cloneDeep(doc.payload);
    if (type === 'past-papers' || type === 'past-interviews') {
      return normalizePastPayloadForApi(p.commissions || []);
    }
    if (type === 'mcqs') {
      const categories = [...(p.categories || [])].sort((a, b) =>
        String(a.label || '').localeCompare(String(b.label || ''))
      );
      return { categories };
    }
    if (type === 'mock-tests') {
      return normalizeMockTestsPayloadForApi(p);
    }
  }

  return loadStaticCategoryData(type);
}

/**
 * Raw document payload for mutations (same shape as stored / API data).
 */
export async function getPayloadForMutation(type) {
  const doc = await CategoryStructureConfig.findOne({ structureKey: type }).lean();
  if (doc?.payload) {
    return cloneDeep(doc.payload);
  }
  return loadStaticCategoryData(type);
}

export async function upsertCategoryPayload(type, payload) {
  if (!CATEGORY_STRUCTURE_TYPES.includes(type)) {
    throw new Error(`Invalid type parameter: ${type}`);
  }
  await CategoryStructureConfig.findOneAndUpdate(
    { structureKey: type },
    { $set: { payload } },
    { upsert: true, new: true }
  );
}

function ensureNestedSubcategories(nodes) {
  if (!Array.isArray(nodes)) return;
  for (const n of nodes) {
    if (!n.subcategories) n.subcategories = [];
    ensureNestedSubcategories(n.subcategories);
  }
}

function normalizeBulkStructure(type, structure) {
  if (type === 'mcqs') {
    return { categories: structure.categories || [] };
  }
  if (type === 'past-papers' || type === 'past-interviews') {
    const commissions = (structure.commissions || []).map((c) => {
      let iconName = 'Building2';
      if (typeof c.icon === 'string') iconName = c.icon;
      else if (c.icon && typeof c.icon === 'function') {
        iconName = c.icon.name || c.icon.displayName || 'Building2';
      } else if (c.icon && typeof c.icon === 'object') {
        iconName = c.icon.name || c.icon.displayName || 'Building2';
      }
      const out = {
        ...c,
        icon: iconName,
        departments: (c.departments || []).map((d) => ({
          ...d,
          roles: (d.roles || []).map((r) => ({
            ...r,
            subcategories: r.subcategories || [],
          })),
        })),
      };
      for (const d of out.departments || []) {
        for (const r of d.roles || []) {
          ensureNestedSubcategories(r.subcategories);
        }
      }
      return out;
    });
    return { commissions };
  }
  if (type === 'mock-tests') {
    return normalizeMockTestsPayloadForApi({
      categories: structure.categories || [],
      universities: structure.universities || [],
    });
  }
  throw new Error(`Invalid type: ${type}`);
}

export async function saveBulkStructure(type, structure) {
  const payload = normalizeBulkStructure(type, structure);
  await upsertCategoryPayload(type, payload);
}

export async function applyPostMutationAndSave(type, action, data) {
  const payload = await getPayloadForMutation(type);
  applyCategoryStructureMutation(payload, type, action, data);
  await upsertCategoryPayload(type, payload);
}
