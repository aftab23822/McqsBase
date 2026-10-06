import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BLOG_ROOT = path.join(ROOT, 'public', 'blog');
const REGISTRY_PATH = path.join(ROOT, 'src', 'data', 'importedBlogArticles.js');

const TOPIC_IDEAS = [
  'mcqs for junior clerk test preparation',
  'mcqs for Pak Army test',
  'mcqs for Pakistan Air Force test',
  'mcqs for Pakistan Navy test',
  'mcqs for MDCAT',
  'mcqs for ISSB',
  'mcqs for Sindh Rangers',
  'mcqs for Motorway Police',
  'mcqs for entry test Sindh University Jamshoro',
  'mcqs for MUET Mehran University',
  'mcqs for COMSATS entry test',
  'mcqs for NAT',
  'mcqs for HAT',
  'top repeated 100 MCQs in NTS test',
  'top repeated current affairs MCQs',
  'top repeated general knowledge MCQs',
  'PPSC one paper MCQs',
  'FPSC screening test MCQs',
  'SPSC screening test MCQs',
  'police constable test MCQs',
  'airport security force test MCQs',
  'banking test MCQs',
  'teaching jobs test MCQs',
  'university entry test MCQs',
  'scholarship test MCQs'
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

function daySeed(date) {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86400000);
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function escapeCell(value = '') {
  return String(value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string') {
    return payload.output_text;
  }

  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function readExistingBlogHints(limit = 60) {
  if (!existsSync(REGISTRY_PATH)) return [];

  const source = readFileSync(REGISTRY_PATH, 'utf8');
  const matches = [...source.matchAll(/"([^"]+)":\s*\{\s*title:\s*"([^"]+)"/g)];
  return matches
    .slice(0, limit)
    .map((match) => ({ slug: match[1], title: match[2] }));
}

function normalizeMcq(raw) {
  const options = Array.isArray(raw.options)
    ? raw.options.map((option) => String(option).trim()).filter(Boolean)
    : [];
  const answer = String(raw.correctAnswer || '').trim();
  let answerIndex = options.findIndex((option) => option.toLowerCase() === answer.toLowerCase());

  const letterMatch = answer.match(/^([A-E])[.)]?\s*(.*)$/i);
  if (answerIndex === -1 && letterMatch) {
    answerIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
  }

  if (!raw.question || options.length !== 4 || answerIndex < 0 || answerIndex >= options.length) {
    return null;
  }

  return {
    question: String(raw.question).trim(),
    options,
    answerIndex
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

function validateDraft(draft) {
  const mcqs = uniqueMcqs(draft?.mcqs || []);
  if (mcqs.length !== 100) {
    throw new Error(`AI draft must contain exactly 100 unique valid MCQs; received ${mcqs.length}.`);
  }

  const topicName = String(draft.topicName || '').trim();
  const primaryKeyword = String(draft.primaryKeyword || '').trim();
  const title = String(draft.title || '').trim();
  const excerpt = String(draft.excerpt || '').trim();
  const intro = String(draft.intro || '').trim();
  const description = String(draft.description || '').trim();
  const focusRows = Array.isArray(draft.focusRows) ? draft.focusRows : [];
  const revisionTips = Array.isArray(draft.revisionTips) ? draft.revisionTips : [];
  const faqs = Array.isArray(draft.faqs) ? draft.faqs : [];

  if (!topicName || !primaryKeyword || !title || !excerpt || !intro || !description) {
    throw new Error('AI draft is missing required SEO article fields.');
  }
  if (focusRows.length < 5 || revisionTips.length < 4 || faqs.length < 4) {
    throw new Error('AI draft is missing focus rows, revision tips, or FAQs.');
  }

  return {
    ...draft,
    topicName,
    topicSlug: slugify(draft.topicSlug || topicName),
    primaryKeyword,
    title,
    excerpt,
    intro,
    description,
    focusRows,
    revisionTips,
    faqs,
    mcqs
  };
}

async function generateAiDraft(date) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for AI-first daily blog generation. Add it as a GitHub Actions secret.');
  }

  const requestedTopic = getArg('topic') || getArg('category') || process.env.BLOG_TOPIC || process.env.BLOG_CATEGORY || '';
  const model = process.env.OPENAI_MODEL || 'gpt-6-luna';
  const seed = daySeed(date);
  const existingBlogs = readExistingBlogHints();
  const ideaWindow = [
    ...TOPIC_IDEAS.slice(seed % TOPIC_IDEAS.length),
    ...TOPIC_IDEAS.slice(0, seed % TOPIC_IDEAS.length)
  ].slice(0, 12);

  const prompt = [
    'Create one complete static SEO blog package for McqsBase.com.',
    `Publish date: ${date}.`,
    requestedTopic
      ? `User-requested topic: ${requestedTopic}. Use this topic unless it is unsafe or impossible.`
      : 'Choose the smartest topic yourself for today from Pakistan exam-preparation search intent. Do not simply rotate English. Prefer test-specific and high-search-intent topics.',
    `Topic ideas, not limits: ${ideaWindow.join('; ')}.`,
    `Avoid duplicating these recent blog slugs/titles: ${JSON.stringify(existingBlogs)}`,
    '',
    'Strict content requirements:',
    '- Generate every part using AI. Do not depend on existing local MCQ data.',
    '- Topic should be specific enough to rank, such as a job test, forces test, university entry test, NTS/HAT/NAT, current affairs, or repeated GK intent.',
    '- Title must be SEO-rich, natural, and not clickbait.',
    '- Description must support SEO and mention the exact exam/test intent.',
    '- Include test focus topics that match the selected test.',
    '- Generate exactly 100 original, high-quality MCQs with four options each.',
    '- Correct answer must be one of the options exactly.',
    '- MCQs should be exam-style, high-frequency, and aligned with repeated/past-paper-style patterns.',
    '- Do not claim questions are copied from a real paper or exact official past paper.',
    '- Avoid unstable current facts unless they are durable as of the publish date.',
    '- No emojis, no markdown in JSON values, no promotional fluff.',
    '- Return JSON only.'
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: 'You are an expert SEO education editor for Pakistan MCQ test preparation. You create accurate, original, exam-style MCQs and structured static blog data. Return only schema-valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'ai_daily_blog',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['topicName', 'topicSlug', 'primaryKeyword', 'title', 'excerpt', 'intro', 'description', 'focusRows', 'revisionTips', 'faqs', 'mcqs'],
            properties: {
              topicName: { type: 'string' },
              topicSlug: { type: 'string' },
              primaryKeyword: { type: 'string' },
              title: { type: 'string' },
              excerpt: { type: 'string' },
              intro: { type: 'string' },
              description: { type: 'string' },
              focusRows: {
                type: 'array',
                minItems: 5,
                maxItems: 8,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['area', 'whatToPractice'],
                  properties: {
                    area: { type: 'string' },
                    whatToPractice: { type: 'string' }
                  }
                }
              },
              revisionTips: {
                type: 'array',
                minItems: 4,
                maxItems: 7,
                items: { type: 'string' }
              },
              faqs: {
                type: 'array',
                minItems: 4,
                maxItems: 7,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['question', 'answer'],
                  properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' }
                  }
                }
              },
              mcqs: {
                type: 'array',
                minItems: 100,
                maxItems: 100,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['question', 'options', 'correctAnswer'],
                  properties: {
                    question: { type: 'string' },
                    options: {
                      type: 'array',
                      minItems: 4,
                      maxItems: 4,
                      items: { type: 'string' }
                    },
                    correctAnswer: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      max_output_tokens: 22000
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI daily blog generation failed (${response.status}): ${message}`);
  }

  const payload = await response.json();
  return validateDraft(JSON.parse(extractOutputText(payload)));
}

function formatQuestionCell(mcq) {
  const labels = ['A', 'B', 'C', 'D'];
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

function buildArticle(draft, date) {
  const prettyDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
  const focusTableRows = draft.focusRows
    .map((row, index) => `| ${index + 1} | ${escapeCell(row.area)} | ${escapeCell(row.whatToPractice)} |`)
    .join('\n');
  const revisionList = draft.revisionTips.map((tip, index) => `${index + 1}. ${tip}`).join('\n');
  const faqBlocks = draft.faqs
    .map((faq) => [`### ${faq.question}`, '', faq.answer, ''].join('\n'))
    .join('\n');

  const body = [
    `${draft.topicName} MCQs Practice Set for ${prettyDate}`,
    '',
    draft.intro,
    '',
    `## Why this ${draft.topicName} set is useful`,
    '',
    `${draft.description} Start with this focused set, then continue with the [MCQsBase question bank](https://www.mcqsbase.com/mcqs), [online quiz practice](https://www.mcqsbase.com/quiz), [past papers](https://www.mcqsbase.com/past-papers), and the complete [MCQsBase blog](https://www.mcqsbase.com/blog).`,
    '',
    '## Test focus topics',
    '',
    '| No. | Focus Area | What to Practice |',
    '| --- | --- | --- |',
    focusTableRows,
    '',
    '## What this set covers',
    '',
    '| Section | Questions | Focus |',
    '| --- | --- | --- |',
    `| Set 1 | 1-20 | Core ${draft.topicName} fundamentals |`,
    '| Set 2 | 21-40 | Frequently repeated test concepts |',
    '| Set 3 | 41-60 | Mixed exam-style practice |',
    '| Set 4 | 61-80 | Fast recall and elimination practice |',
    '| Set 5 | 81-100 | Final revision and score-building |',
    '',
    tableForSet(draft.mcqs, 0, `1-20. ${draft.topicName} MCQs`),
    tableForSet(draft.mcqs, 20, `21-40. ${draft.topicName} MCQs`),
    tableForSet(draft.mcqs, 40, `41-60. ${draft.topicName} MCQs`),
    tableForSet(draft.mcqs, 60, `61-80. ${draft.topicName} MCQs`),
    tableForSet(draft.mcqs, 80, `81-100. ${draft.topicName} MCQs`),
    `## How to revise this ${draft.topicName} set`,
    '',
    revisionList,
    '',
    '## Frequently Asked Questions',
    '',
    faqBlocks,
    '',
    '## Final Takeaway',
    '',
    `Consistent daily MCQ practice is one of the simplest ways to improve recall, speed, and exam confidence. Bookmark this page, complete the 100 ${draft.topicName} MCQs, and continue your preparation on [McqsBase](https://www.mcqsbase.com/).`,
    ''
  ].join('\n');

  return { title: draft.title, excerpt: draft.excerpt, body };
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
  const draft = await generateAiDraft(date);
  const slug = `${draft.topicSlug}-${date}`;
  const targetDir = path.join(BLOG_ROOT, slug);
  const articlePath = path.join(targetDir, 'article.md');
  const article = buildArticle(draft, date);

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

  console.log(`${inserted ? 'Created' : 'Already registered'} ${slug} from AI topic "${draft.topicName}" with 100 MCQs.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
