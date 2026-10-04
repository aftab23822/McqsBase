import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BLOG_ROOT = path.join(ROOT, 'public', 'blog');
const REGISTRY_PATH = path.join(ROOT, 'src', 'data', 'importedBlogArticles.js');

const categories = [
  {
    name: 'General Knowledge',
    slug: 'general-knowledge',
    sourceFile: 'generalKnowledgeMcqsData.json',
    primaryKeyword: 'general knowledge MCQs with answers',
    focus: 'PPSC, FPSC, SPSC, NTS and one-paper competitive exams'
  },
  {
    name: 'English',
    slug: 'english',
    sourceFile: 'englishMcqsData.json',
    primaryKeyword: 'English MCQs with answers',
    focus: 'CSS, PMS, PPSC, FPSC, SPSC, NTS and screening tests'
  },
  {
    name: 'Mathematics',
    slug: 'maths',
    sourceFile: 'mathsMcqsData.json',
    primaryKeyword: 'mathematics MCQs with answers',
    focus: 'quantitative ability, aptitude, NTS, PPSC and FPSC tests'
  },
  {
    name: 'Everyday Science',
    slug: 'everyday-science',
    sourceFile: 'everydayScienceMcqsData.json',
    primaryKeyword: 'everyday science MCQs with answers',
    focus: 'general science, CSS, PMS, PPSC, FPSC and SPSC exams'
  },
  {
    name: 'Pakistan Studies',
    slug: 'pakistan-studies',
    sourceFile: 'pakStudyMcqsData.json',
    primaryKeyword: 'Pakistan Studies MCQs with answers',
    focus: 'Pakistan affairs, CSS, PMS, PPSC, FPSC and SPSC tests'
  },
  {
    name: 'Islamic Studies',
    slug: 'islamic-studies',
    sourceFile: 'islamicStudiesMcqsData.json',
    primaryKeyword: 'Islamic Studies MCQs with answers',
    focus: 'Islamiat, CSS, PMS, PPSC, FPSC, SPSC and NTS exams'
  },
  {
    name: 'Computer',
    slug: 'computer',
    sourceFile: 'computerMcqsData.json',
    primaryKeyword: 'computer MCQs with answers',
    focus: 'computer literacy, IT, PPSC, FPSC, SPSC and NTS tests'
  }
];

function getArg(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((arg) => arg.startsWith(prefix));
  return item ? item.slice(prefix.length) : '';
}

function isoDate(input = '') {
  const source = input || process.env.BLOG_DATE || new Date().toISOString();
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid BLOG_DATE: ${source}`);
  }
  return date.toISOString().slice(0, 10);
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeCell(value = '') {
  return String(value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function collectMcqs(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectMcqs(item, output));
    return output;
  }

  if (value && typeof value === 'object') {
    if (typeof value.question === 'string' && Array.isArray(value.options)) {
      output.push(value);
    }
    Object.values(value).forEach((item) => collectMcqs(item, output));
  }

  return output;
}

function normalizeMcq(raw) {
  const options = Array.isArray(raw.options)
    ? raw.options.map((option) => String(option).trim()).filter(Boolean)
    : [];
  const answer = String(raw.correctAnswer || raw.answer || raw.correct_option || raw.correct || '').trim();
  let answerIndex = options.findIndex((option) => option.toLowerCase() === answer.toLowerCase());

  const letterMatch = answer.match(/^([A-E])[.)]?\s*(.*)$/i);
  if (answerIndex === -1 && letterMatch) {
    answerIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
  }

  if (!raw.question || options.length < 2 || answerIndex < 0 || answerIndex >= options.length) {
    return null;
  }

  return {
    question: String(raw.question).trim(),
    options,
    answerIndex,
    explanation: raw.explanation ? String(raw.explanation).trim() : ''
  };
}

function uniqueMcqs(items) {
  const seen = new Set();
  const clean = [];

  for (const item of items.map(normalizeMcq).filter(Boolean)) {
    const key = item.question.toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.add(key);
      clean.push(item);
    }
  }

  return clean;
}

function loadStaticMcqs(category) {
  const filePath = path.join(ROOT, 'src', 'data', 'mcqs', category.sourceFile);
  if (!existsSync(filePath)) return [];
  return collectMcqs(JSON.parse(readFileSync(filePath, 'utf8')));
}

async function loadLiveMcqs(category) {
  const baseUrl = (process.env.MCQSBASE_SOURCE_URL || '').replace(/\/+$/, '');
  if (!baseUrl || typeof fetch !== 'function') return [];

  try {
    const response = await fetch(`${baseUrl}/api/mcqs/${category.slug}?page=1&limit=100`);
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.results || [];
  } catch {
    return [];
  }
}

function rotate(items, seed) {
  if (items.length === 0) return items;
  const start = seed % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function daySeed(date) {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86400000);
}

async function chooseCategory(date) {
  const requested = getArg('category') || process.env.BLOG_CATEGORY || '';
  const normalizedRequested = slugify(requested);
  const ordered = normalizedRequested
    ? [...categories.filter((category) => category.slug === normalizedRequested || slugify(category.name) === normalizedRequested), ...categories]
    : rotate(categories, daySeed(date));

  const tried = new Set();
  for (const category of ordered) {
    if (tried.has(category.slug)) continue;
    tried.add(category.slug);

    const mcqs = uniqueMcqs([...(await loadLiveMcqs(category)), ...loadStaticMcqs(category)]);
    if (process.env.DEBUG_DAILY_BLOG === '1') {
      console.log(`${category.name}: ${mcqs.length} usable MCQs`);
    }
    if (mcqs.length >= 100) {
      return { category, mcqs };
    }
  }

  throw new Error('No configured category currently has 100 usable MCQs. Add more MCQs or set MCQSBASE_SOURCE_URL to a live site with enough questions.');
}

function formatQuestionCell(mcq) {
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const options = mcq.options.map((option, index) => `${labels[index]}) ${escapeCell(option)}`);
  return [escapeCell(mcq.question), ...options].join('<br />');
}

function formatAnswerCell(mcq) {
  const letter = String.fromCharCode(65 + mcq.answerIndex);
  return `**${letter}) ${escapeCell(mcq.options[mcq.answerIndex])}**`;
}

function tableForSet(mcqs, offset, heading) {
  const rows = mcqs.slice(offset, offset + 20).map((mcq, index) => {
    const number = offset + index + 1;
    return `| ${number} | ${formatQuestionCell(mcq)} | ${formatAnswerCell(mcq)} |`;
  });

  return [
    `::: callout ${heading}<br />Choose one option, then check the bold answer.`,
    '',
    '| No. | Question & Options | Answer |',
    '| --- | --- | --- |',
    ...rows,
    ''
  ].join('\n');
}

function buildArticle({ category, mcqs, date }) {
  const prettyDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

  const title = `100 ${category.name} MCQs with Answers for Competitive Exams - ${prettyDate}`;
  const excerpt = `Practice 100 ${category.name} MCQs with bold answers for ${category.focus}. This daily static MCQsBase set supports fast SEO-friendly revision and exam preparation.`;
  const sectionTitle = `${category.name} MCQs Practice Set`;
  const article = [
    `${sectionTitle} for ${prettyDate}`,
    '',
    `Practice 100 ${category.name} MCQs with answers selected in bold for quick checking. This daily McqsBase set is built for ${category.focus} and follows high-frequency, past-paper-style patterns commonly seen in similar objective tests.`,
    '',
    `## Why this ${category.name} MCQs set is useful`,
    '',
    `This page targets learners searching for [${category.primaryKeyword}](https://www.mcqsbase.com/mcqs/${category.slug}), online MCQ practice, solved MCQs, and competitive exam preparation in Pakistan. Use it as a focused daily revision block, then continue with the full [MCQsBase question bank](https://www.mcqsbase.com/mcqs), [online quiz practice](https://www.mcqsbase.com/quiz), and [past papers](https://www.mcqsbase.com/past-papers).`,
    '',
    `The questions are arranged for fast scanning: read the stem, solve mentally, then compare with the bold answer. For broader strategy, visit the [MCQsBase blog](https://www.mcqsbase.com/blog) and combine this page with timed practice.`,
    '',
    `## What this set covers`,
    '',
    '| Section | Questions | Focus |',
    '| --- | --- | --- |',
    `| Set 1 | 1-20 | Core ${category.name} fundamentals |`,
    `| Set 2 | 21-40 | Frequently repeated test concepts |`,
    `| Set 3 | 41-60 | Mixed competitive-exam practice |`,
    `| Set 4 | 61-80 | Fast recall and elimination practice |`,
    `| Set 5 | 81-100 | Final revision and score-building |`,
    '',
    tableForSet(mcqs, 0, `1-20. ${category.name} MCQs`),
    tableForSet(mcqs, 20, `21-40. ${category.name} MCQs`),
    tableForSet(mcqs, 40, `41-60. ${category.name} MCQs`),
    tableForSet(mcqs, 60, `61-80. ${category.name} MCQs`),
    tableForSet(mcqs, 80, `81-100. ${category.name} MCQs`),
    `## How to revise this ${category.name} set`,
    '',
    '1. Attempt all 100 MCQs before checking the bold answers.',
    '2. Mark every wrong answer and re-attempt it after one day.',
    '3. Use a timer on the second attempt to improve speed and accuracy.',
    '4. Open the related MCQsBase category page for more topic-wise practice.',
    '',
    '## Frequently Asked Questions',
    '',
    `### Are these ${category.name} MCQs useful for competitive exams?`,
    '',
    `Yes. The set is designed around high-frequency, past-paper-style MCQ patterns used in ${category.focus}.`,
    '',
    '### How should I use this page for daily preparation?',
    '',
    'Attempt the full set once, review only the wrong answers, and then repeat the missed questions the next day. This creates active recall instead of passive reading.',
    '',
    '### Does McqsBase publish MCQ practice daily?',
    '',
    'The autopilot format is designed to publish one static MCQ practice blog per day, using a different suitable category when enough verified questions are available.',
    '',
    '## Final Takeaway',
    '',
    `Consistent daily MCQ practice is one of the simplest ways to improve recall, speed, and exam confidence. Bookmark this page, complete the 100 ${category.name} MCQs, and continue your preparation on [McqsBase](https://www.mcqsbase.com/).`,
    ''
  ].join('\n');

  return { title, excerpt, body: article };
}

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min`;
}

function insertRegistryEntry(slug, metadata) {
  const source = readFileSync(REGISTRY_PATH, 'utf8');
  if (source.includes(`"${slug}"`)) {
    return false;
  }

  const entry = `  "${slug}": {
    title: ${JSON.stringify(metadata.title)},
    excerpt:
      ${JSON.stringify(metadata.excerpt)},
    category: "Subject Guide",
    date: ${JSON.stringify(metadata.date)},
    readTime: ${JSON.stringify(metadata.readTime)},
    content: null,
    body: readImportedBlogBody("${slug}")
  },
`;

  const marker = 'export const importedBlogArticles = {\n';
  if (!source.includes(marker)) {
    throw new Error('Could not find importedBlogArticles registry marker.');
  }

  writeFileSync(REGISTRY_PATH, source.replace(marker, marker + entry), 'utf8');
  return true;
}

async function main() {
  const date = isoDate(getArg('date'));
  const { category, mcqs } = await chooseCategory(date);
  const slug = `100-${category.slug}-mcqs-with-answers-${date}`;
  const targetDir = path.join(BLOG_ROOT, slug);
  const articlePath = path.join(targetDir, 'article.md');
  const selected = rotate(mcqs, daySeed(date)).slice(0, 100);
  const article = buildArticle({ category, mcqs: selected, date });

  if (!existsSync(articlePath)) {
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(articlePath, article.body, 'utf8');
  }

  const inserted = insertRegistryEntry(slug, {
    title: article.title,
    excerpt: article.excerpt,
    date,
    readTime: estimateReadTime(article.body)
  });

  console.log(`${inserted ? 'Created' : 'Already registered'} ${slug} from ${category.name} with 100 MCQs.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
