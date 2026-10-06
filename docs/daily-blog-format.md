# McqsBase Daily MCQ Blog Format

Every autopublished MCQsBase blog should be a static Markdown article under `public/blog/{slug}/article.md` and must be registered in `src/data/importedBlogArticles.js`.

## Article Standard

- Title: SEO-friendly, usually `100 {Topic} MCQs with Answers - {Date}` or a stronger test-specific variant.
- Slug: `{topic-slug}`. Do not append the publish date; if the same slug already exists, use a short numeric suffix such as `{topic-slug}-2`.
- Category: `Subject Guide`
- Author voice: clear, exam-focused, and useful for Pakistan competitive exam candidates.
- Description: include one short SEO-supporting paragraph near the top with the primary keyword, related exam names, and an internal link to McqsBase.
- Question count: exactly 100 MCQs.
- Answer style: the correct answer must be bold in Markdown, for example `**B) Generous**`.
- Source wording: use "past-paper-style", "high-frequency", or "aligned with repeated competitive-test patterns" unless a real source proves exact past-paper origin.
- Internal links: include links to the category page, MCQs homepage, quiz page, past papers page, and blog archive where natural.
- Static SEO: sitemap inclusion should happen through `blogArticles`, not through database-only blog storage.
- AI-first generation: the daily generator must choose the topic, SEO framing, focus table, FAQs, and all 100 MCQs using AI. It must not depend on existing local MCQ data.
- Secret handling: add `OPENAI_API_KEY` in GitHub Secrets, never in repo files.
- Topic intelligence: the generator may use seed ideas, but the AI should choose a smart high-intent exam topic dynamically and avoid duplicating recent posts.
- Test-specific coverage: include focused preparation pages for junior clerk, Pak Army, Pakistan Air Force, Pakistan Navy, MDCAT, ISSB, Sindh Rangers, Motorway Police, Sindh University, MUET, COMSATS, NAT, HAT, NTS repeated MCQs, current affairs, general knowledge, and similar exam-intent topics.

## Article Structure

1. Short opening line.
2. `## Why this {Topic} set is useful`
3. `## Test focus topics`
4. `## What this set covers`
5. Five MCQ tables of 20 questions each.
6. `## How to revise this set`
7. `## Frequently Asked Questions`
8. `## Final Takeaway`

## MCQ Table Shape

Use this exact table shape so the blog renderer turns each row into a readable MCQ card:

```md
| No. | Question & Options | Answer |
| --- | --- | --- |
| 1 | Question text?<br />A) Option one<br />B) Option two<br />C) Option three<br />D) Option four | **B) Option two** |
```

The renderer highlights the selected answer when the answer begins with a letter such as `A)`, `B)`, `C)`, or `D)`, including bold-wrapped answers.
