import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '../src/index.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'McqsBase.com - Pakistan\'s Premier MCQ Platform',
  description: 'Comprehensive MCQ platform for Pakistan competitive exams. Practice MCQs, download past papers, and prepare for FPSC, SPSC, PPSC, and NTS exams with thousands of questions.',
  keywords: 'MCQs, Pakistan competitive exams, FPSC, SPSC, PPSC, NTS, past papers, interview preparation, exam preparation, online quiz',
  authors: [{ name: 'McqsBase.com' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    url: 'https://mcqsbase.com/',
    title: 'McqsBase.com - Pakistan\'s Premier MCQ Platform',
    description: 'Comprehensive MCQ platform for Pakistan competitive exams. Practice MCQs, download past papers, and prepare for FPSC, SPSC, PPSC, and NTS exams with thousands of questions.',
    images: [
      {
        url: 'https://mcqsbase.com/eagle.svg',
        alt: 'McqsBase.com Logo'
      }
    ],
    siteName: 'McqsBase.com',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'McqsBase.com - Pakistan\'s Premier MCQ Platform',
    description: 'Comprehensive MCQ platform for Pakistan competitive exams. Practice MCQs, download past papers, and prepare for FPSC, SPSC, PPSC, and NTS exams with thousands of questions.',
    images: ['https://mcqsbase.com/eagle.svg'],
  },
  other: {
    'theme-color': '#3B82F6',
    'msapplication-TileColor': '#3B82F6',
    'language': 'English',
    'geo.region': 'PK',
    'geo.country': 'Pakistan',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/eagle.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="canonical" href="https://mcqsbase.com/" />
        <meta name="google-site-verification" content="WGnVaxb3MaxbnE_dIZ_EYGB9mUMfA1knPGt7sIyhu0I" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "McqsBase.com",
              "url": "https://mcqsbase.com",
              "description": "Pakistan's premier platform for competitive exam preparation with MCQs, past papers, and interview materials.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://mcqsbase.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "McqsBase.com",
              "url": "https://mcqsbase.com",
              "logo": "https://mcqsbase.com/eagle.svg",
              "description": "Pakistan's premier platform for competitive exam preparation with MCQs, past papers, and interview materials.",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "contact@mcqsbase.com"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
