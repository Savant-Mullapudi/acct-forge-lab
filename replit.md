# Payment Portal Demo

## Project Overview
This is a Payment Portal Demo application built with Vite, React, TypeScript, and shadcn-ui components. The application showcases a payment flow with multiple pages including checkout, login, and success pages.

## Technologies Used
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Components**: shadcn-ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation

## Project Structure
- `src/pages/` - Application pages (Index, Checkout, Login, Success, NotFound)
- `src/components/` - Reusable UI components and page-specific components
- `src/assets/` - Images and static assets
- `src/styles/` - Custom CSS files
- `public/` - Static files served directly

## Development Setup
The application runs on port 5000 with the following configuration:
- Dev server: `npm run dev` (configured for Replit environment)
- Build: `npm run build`
- Preview: `npm run preview`

## Replit Configuration
- **Port**: 5000 (both dev and preview)
- **Host**: 0.0.0.0 (allows external connections)
- **Workflow**: "Start application" runs `npm run dev`
- **Deployment**: Configured for autoscale deployment with build + preview

## Recent Changes

### 2025-10-01
- **Password Reset Feature**: Implemented 6-digit code password reset flow with Resend email delivery
  - Users receive a 6-digit code via email (Resend API) instead of reset links
  - 3-step process on same page: email → code verification → new password
  - Custom Supabase Edge Functions handle code generation, email sending, and verification
  - Floating labels with blue focus states matching login page design
  - Secure database table stores codes with 15-minute expiration
  - Generic messaging prevents account enumeration on client-side
  - RLS policies ensure only service role can access reset codes table

### 2025-09-30
- Installed npm dependencies
- Updated vite.config.ts to use port 5000 and host 0.0.0.0
- Added preview server configuration for deployment
- Configured workflow for Replit environment
- Set up deployment configuration for autoscale

## Project Architecture
This is a frontend-only application with the following key features:
- Payment checkout flow
- User authentication (login page)
- Success page for completed transactions
- Responsive design with Tailwind CSS
- Component library using shadcn-ui

## Notes
- Originally created in Lovable (lovable.dev)
- Imported to Replit for continued development
- Uses modern React patterns with hooks and TypeScript
- Fully configured for Replit's environment with proper port and host settings
