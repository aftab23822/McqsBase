# McqsBase.com - Next.js Migration

This project has been migrated from Vite + React Router to Next.js App Router.

## Migration Changes

### What was changed: 
- ✅ Converted from Vite to Next.js
- ✅ Updated React Router to Next.js App Router
- ✅ Converted `Link` components from `to` prop to `href` prop
- ✅ Updated `useLocation` to `useRouter` 
- ✅ Created Next.js app directory structure
- ✅ Added Next.js metadata API in layout.js
- ✅ Created page.js files for all routes
- ✅ Added API routes structure
- ✅ Preserved existing UI and functionality

### What was preserved:
- ✅ All existing components and their UI
- ✅ TailwindCSS styling
- ✅ Component structure and organization
- ✅ Data files and assets
- ✅ Existing functionality

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your actual values

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Routes

All existing routes have been preserved:
- `/` - Home page
- `/mcqs` - MCQs collection
- `/quiz` - Interactive quizzes
- `/past-papers` - Past papers
- `/past-interviews` - Interview questions
- `/courses` - Courses (if enabled)
- `/contact` - Contact form
- `/submit-mcqs` - Submit MCQs form
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service
- `/sitemap` - Site map
- `/coming-soon` - Coming soon page
- `/404/admin` - Admin login

## API Routes

- `POST /api/contact` - Contact form submission

## Environment Variables

See `.env.local.example` for required environment variables.

## Deployment

The project is configured for static export and can be deployed to any static hosting service or Vercel.

For static export:
```bash
npm run build
```

The built files will be in the `dist` directory.
