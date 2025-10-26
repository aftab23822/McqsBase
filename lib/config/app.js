/**
 * Application Configuration for Next.js
 * Centralized configuration management
 */

export const APP_CONFIG = {
  // Application Info
  name: 'McqsBase.com',
  description: "Pakistan's premier platform for competitive exam preparation",
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://mcqsbase.com',
  
  // Contact Info
  email: 'contact@mcqsbase.com',
  supportEmail: 'support@mcqsbase.com',
  
  // Social Media
  social: {
    facebook: 'https://facebook.com/mcqsbase',
    twitter: 'https://twitter.com/mcqsbase',
    instagram: 'https://instagram.com/mcqsbase',
    linkedin: 'https://linkedin.com/company/mcqsbase'
  },
  
  // SEO
  seo: {
    keywords: [
      'Pakistan competitive exams',
      'MCQs',
      'FPSC',
      'SPSC',
      'PPSC',
      'NTS',
      'exam preparation',
      'past papers',
      'interview questions'
    ],
    author: 'McqsBase.com Team',
    locale: 'en_US',
    themeColor: '#3B82F6'
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 10000,
    retries: 3
  },
  
  // Database
  database: {
    main: process.env.MONGO_URI,
    admin: process.env.ADMIN_MONGO_URI || process.env.MONGO_URI?.replace('/mcqs', '/admindb')
  },
  
  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiration: '24h',
    cookieName: 'mcqs-auth-token'
  },
  
  // reCAPTCHA
  recaptcha: {
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    scoreThreshold: 0.5
  },
  
  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.FROM_EMAIL || 'noreply@mcqsbase.com'
  },
  
  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
    mcqsPerPage: 20,
    quizzesPerPage: 10
  },
  
  // File Upload
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    directory: 'uploads/'
  },
  
  // Feature Flags
  features: {
    enableUserSubmissions: true,
    enableAdminPanel: true,
    enableQuizzes: true,
    enablePastPapers: true,
    enableInterviews: true,
    enableAnalytics: true,
    enableRateLimiting: true
  },
  
  // Rate Limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: true
  }
};

// Environment-specific configurations
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Validation function to check required environment variables
export const validateConfig = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET'
  ];
  
  const optional = [
    'NEXT_PUBLIC_API_URL',
    'ADMIN_MONGO_URI',
    'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
    'RECAPTCHA_SECRET_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const warnings = optional.filter(key => !process.env[key]);
  if (warnings.length > 0 && isDevelopment) {
    console.warn(`Optional environment variables not set: ${warnings.join(', ')}`);
  }
  
  return {
    valid: true,
    missing: [],
    warnings
  };
};

export default APP_CONFIG;
