# API Migration Guide

Your app makes many API calls to endpoints like:
- `/api/mcqs/general-knowledge`
- `/api/quiz/everyday-science`  
- `/api/pastpapers/*`
- And many more...

You have **3 options** to handle this:

## Option 1: Keep Your Existing Server (RECOMMENDED)

Continue using your separate API server. Just update environment variables:

**In .env.local:**
```bash
# Point to your existing API server
NEXT_PUBLIC_API_URL=http://localhost:5000
# OR for production:
# NEXT_PUBLIC_API_URL=https://your-api-server.com
```

**Pros:**
- ✅ Zero code changes needed
- ✅ Keep existing server logic
- ✅ Gradual migration possible

**Cons:**
- ❌ Still need to maintain separate server
- ❌ Two deployments (frontend + backend)

---

## Option 2: Migrate All APIs to Next.js (FUTURE)

Create Next.js API routes for all endpoints:

```javascript
// app/api/mcqs/general-knowledge/route.js
export async function GET(request) {
  // Your MCQ logic here
  return NextResponse.json({ mcqs: [...] });
}

// app/api/quiz/everyday-science/route.js  
export async function GET(request) {
  // Your quiz logic here
  return NextResponse.json({ quizzes: [...] });
}
```

**Pros:**
- ✅ Single deployment
- ✅ Better performance
- ✅ Integrated caching

**Cons:**
- ❌ Major migration effort
- ❌ Need to recreate all API logic

---

## Option 3: Hybrid Approach

Keep some APIs on separate server, move others to Next.js:

```javascript
// Different base URLs for different services
const MCQ_API = process.env.NEXT_PUBLIC_MCQ_API_URL;
const QUIZ_API = process.env.NEXT_PUBLIC_QUIZ_API_URL;
```

---

## Current Status After Migration

✅ **What's Working:**
- All UI components migrated to Next.js
- Routing updated to Next.js App Router
- Contact form API route created
- Environment variables updated

⚠️ **What Needs Configuration:**
- Set `NEXT_PUBLIC_API_URL` in `.env.local`
- Point to your existing API server
- Test all API endpoints

---

## Quick Setup

1. **Create `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://your-existing-server:port
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-key
```

2. **Test API Connection:**
```bash
npm run dev
# Check if MCQs/Quiz pages load data
```

3. **Deploy Both:**
- Deploy Next.js frontend
- Keep your existing API server running
- Update CORS if needed

---

## Migration Priority

**Immediate (Option 1):**
- Set environment variables
- Test existing API calls
- Deploy frontend

**Future (Option 2):**
- Gradually migrate API endpoints
- Start with simple ones like contact form
- Move complex business logic later

Would you like help with any specific option?
