# McqsBase Daily MCQ Blog Format

Every autopublished MCQsBase blog should be a static Markdown article under `public/blog/{slug}/article.md` and must be registered in `src/data/importedBlogArticles.js`.

## Article Standard

- Title: `100 {Category} MCQs with Answers for {Exam Focus} - {Date}`
- Slug: `100-{category-slug}-mcqs-with-answers-{yyyy-mm-dd}`
- Category: `Subject Guide`
- Author voice: clear, exam-focused, and useful for Pakistan competitive exam candidates.
- Description: include one short SEO-supporting paragraph near the top with the primary keyword, related exam names, and an internal link to McqsBase.
- Question count: exactly 100 MCQs.
- Answer style: the correct answer must be bold in Markdown, for example `**B) Generous**`.
- Source wording: use "past-paper-style", "high-frequency", or "aligned with repeated competitive-test patterns" unless a real source proves exact past-paper origin.
- Internal links: include links to the category page, MCQs homepage, quiz page, past papers page, and blog archive where natural.
- Static SEO: sitemap inclusion should happen through `blogArticles`, not through database-only blog storage.

## Article Structure

1. Short opening line.
2. `## Why this {Category} MCQs set is useful`
3. `## What this set covers`
4. Five MCQ tables of 20 questions each.
5. `## How to revise this set`
6. `## Frequently Asked Questions`
7. `## Final Takeaway`

## MCQ Table Shape

Use this exact table shape so the blog renderer turns each row into a readable MCQ card:

```md
| No. | Question & Options | Answer |
| --- | --- | --- |
| 1 | Question text?<br />A) Option one<br />B) Option two<br />C) Option three<br />D) Option four | **B) Option two** |
```

The renderer highlights the selected answer when the answer begins with a letter such as `A)`, `B)`, `C)`, or `D)`, including bold-wrapped answers.
