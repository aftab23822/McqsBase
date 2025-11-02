# Google Search Console Setup Guide

This guide will help you submit your sitemap to Google Search Console so that all individual question pages are indexed and appear in search results.

## Prerequisites

1. **Google Account**: You need a Google account to access Search Console
2. **Website Verification**: Your domain needs to be verified in Google Search Console

## Step-by-Step Setup

### 1. Access Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account
3. If you haven't added your property yet, click **"Add Property"**

### 2. Add Your Website Property

1. Select **"URL prefix"** (e.g., `https://mcqsbase.com`)
2. Enter your website URL
3. Click **"Continue"**

### 3. Verify Website Ownership

You can verify ownership using one of these methods:

**Method 1: HTML File Upload (Recommended)**
- Download the HTML verification file from Search Console
- Upload it to your website's `public` folder
- Click **"Verify"** in Search Console

**Method 2: HTML Tag**
- Copy the meta tag provided by Search Console
- Add it to your `app/layout.js` in the `<head>` section
- Click **"Verify"** in Search Console

**Method 3: DNS Verification**
- Add a TXT record to your domain's DNS settings
- Click **"Verify"** in Search Console

### 4. Submit Sitemaps

Once verified, submit your sitemaps:

1. In the left sidebar, click **"Sitemaps"** (under "Indexing")
2. Enter your sitemap URL: `https://mcqsbase.com/sitemap.xml`
3. Click **"Submit"**

**Recommended Sitemaps to Submit:**
- `https://mcqsbase.com/sitemap.xml` (Sitemap Index - includes all sitemaps)
- `https://mcqsbase.com/sitemap-main.xml` (Static pages)
- `https://mcqsbase.com/sitemap-questions.xml` (All individual questions)

**Note:** You only need to submit the sitemap index (`/sitemap.xml`), as it automatically includes the other sitemaps. However, submitting individual sitemaps can help with monitoring.

### 5. Request Indexing (Optional but Recommended)

For faster indexing of new pages:

1. Go to **"URL Inspection"** in the left sidebar
2. Enter a URL you want to index (e.g., `https://mcqsbase.com/mcqs/general-knowledge/question/who-is-newly-elected-president`)
3. Click **"Test Live URL"**
4. If the page is valid, click **"Request Indexing"**

### 6. Monitor Indexing Status

1. Go to **"Coverage"** in the left sidebar to see:
   - How many URLs are indexed
   - Any errors or warnings
   - Which pages are excluded

2. Go to **"Sitemaps"** to see:
   - How many URLs were discovered from your sitemap
   - How many were indexed

## Sitemap URLs

Your website has the following sitemaps:

- **Sitemap Index**: `https://mcqsbase.com/sitemap.xml`
  - References all other sitemaps
  - Submit this to Google

- **Main Pages**: `https://mcqsbase.com/sitemap-main.xml`
  - Contains static pages (home, categories, etc.)

- **Questions**: `https://mcqsbase.com/sitemap-questions.xml`
  - Contains all individual MCQ question pages
  - Updates automatically when new questions are added
  - Supports up to 50,000 URLs per sitemap (Google's limit)

## Testing Your Sitemaps

Before submitting, verify your sitemaps work:

1. **Sitemap Index**: Visit `https://mcqsbase.com/sitemap.xml` in your browser
   - Should display XML with references to other sitemaps

2. **Questions Sitemap**: Visit `https://mcqsbase.com/sitemap-questions.xml`
   - Should display XML with all question URLs
   - Check a few URLs to ensure they're accessible

3. **Validate Sitemaps**:
   - Use [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
   - Or use Google Search Console's built-in validation

## Important Notes

### URL Format
All question URLs follow this pattern:
```
https://mcqsbase.com/mcqs/[subject]/question/[question-slug]
```

Example:
```
https://mcqsbase.com/mcqs/general-knowledge/question/who-is-newly-elected-president-of-germany-in-february-2017
```

### SEO-Friendly URLs
- URLs use clean slugs (no visible IDs)
- Slugs are stored in the database for fast lookups
- Each question has a unique, descriptive URL

### Automatic Updates
- The questions sitemap updates automatically when new questions are added
- Cache is set to 1 hour (`s-maxage=3600`)
- Google will re-crawl periodically

### Sitemap Size
- Google allows up to 50,000 URLs per sitemap
- If you exceed this limit, pagination is supported (e.g., `/sitemap-questions.xml?page=2`)
- The sitemap automatically handles large datasets

## Monitoring and Maintenance

### Regular Checks (Monthly)
1. Check **"Coverage"** for indexing errors
2. Review **"Sitemaps"** for successful submissions
3. Check **"Performance"** to see which questions appear in search results

### When Adding New Questions
- New questions are automatically included in the sitemap
- No manual action needed
- Google will discover new URLs on the next crawl

### Troubleshooting

**Sitemap not being indexed:**
- Verify the sitemap URL is accessible
- Check for XML syntax errors
- Ensure URLs in sitemap return 200 status codes
- Check Google Search Console for specific errors

**Low indexing rate:**
- Ensure pages are accessible (no login required)
- Check for crawl errors in Search Console
- Submit individual high-priority pages for faster indexing
- Ensure pages have proper meta tags and content

## Best Practices

1. **Submit Early**: Submit sitemaps as soon as your site is live
2. **Monitor Regularly**: Check indexing status weekly initially
3. **Fix Errors Quickly**: Address any crawl errors promptly
4. **Keep URLs Clean**: Maintain SEO-friendly URLs (already implemented)
5. **Update Content**: Regularly add new questions to keep content fresh

## Expected Timeline

- **Sitemap Discovery**: Within 24-48 hours after submission
- **Initial Indexing**: 1-2 weeks for first batch of pages
- **Full Indexing**: 2-4 weeks for all pages (depending on site size)
- **Updates**: New pages indexed within days after being added

## Additional Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [SEO Best Practices](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

---

**Need Help?** Check Google Search Console's built-in help and documentation, or consult with an SEO specialist.

