# Al-Himam Smart Medical Platform

Enterprise-grade medical management and communication platform built for Al-Himam Medical Center in Jeddah, Saudi Arabia.

## 🎯 Project Overview

The Al-Himam Smart Medical Platform is a comprehensive solution that supports:
- Full patient lifecycle management
- Automated booking and scheduling for all specialists
- Secure patient-specialist communication via WhatsApp
- Online and remote video consultation with session recording
- AI-powered knowledge base and smart responses
- Insurance API integration for coverage validation and billing
- CRM synchronization and Google Calendar scheduling
- Enterprise-grade workflows via n8n
- Centralized storage and media files in Supabase
- eSignature for medical reports and treatment approvals

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + Preline UI
- **Auth**: Supabase Auth
- **State Management**: React + Supabase Realtime
- **Language**: TypeScript

### Backend
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini API + OpenAI GPT-4 Turbo
- **Workflows**: n8n (Self-hosted or Cloud)
- **Calendar**: Google Calendar & Meet API
- **CRM**: External CRM API (configurable endpoint)
- **Messaging**: Meta WhatsApp Cloud API
- **Storage**: Supabase Storage (for media and documents)

### DevOps
- **Deployment**: Vercel Standard & Edge, Render
- **CI/CD**: GitHub Actions (optional)
- **Package Generator**: Node.js setup-enterprise.mjs script

## 📁 Project Structure

```
Himam-System-Full/
├── app/
│   ├── api/              # API routes
│   │   ├── ai/           # AI integration (Gemini/OpenAI)
│   │   ├── whatsapp/     # WhatsApp Cloud API
│   │   ├── crm/          # CRM synchronization
│   │   ├── calendar/     # Google Calendar integration
│   │   ├── signature/    # Digital signature handling
│   │   └── patients/     # Patient data API
│   ├── dashboard/
│   │   └── admin/        # Admin CMS dashboard
│   ├── sign/             # eSignature page
│   ├── patients/         # Patient dashboard
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # Reusable React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── BookingForm.tsx
│   ├── SpecialistCard.tsx
│   └── ChatWidget.tsx
├── lib/                  # Utility libraries
│   └── supabase.ts       # Supabase client
├── supabase/             # Database files
│   ├── schema.sql        # Database schema
│   ├── seed.sql          # Seed data
│   └── policies.sql      # Row Level Security policies
├── n8n/                  # n8n workflow definitions
│   ├── booking.json
│   ├── billing.json
│   ├── ai-response.json
│   ├── signature.json
│   └── crm-sync.json
├── config/               # Configuration files
├── public/               # Static assets
├── setup-enterprise.mjs  # Deployment package generator
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.example
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Cloud Platform account (for Calendar API)
- Meta Developer account (for WhatsApp Cloud API)
- Gemini API key or OpenAI API key
- n8n instance (self-hosted or cloud)

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in all required values in `.env`:
   - Supabase credentials
   - AI API keys (Gemini and/or OpenAI)
   - WhatsApp Cloud API credentials
   - Google Calendar API credentials
   - CRM API endpoint and key
   - n8n webhook URL

3. **Set up Supabase database**
   - Go to your Supabase project SQL Editor
   - Run `supabase/schema.sql` to create tables
   - Run `supabase/seed.sql` to add initial data
   - Run `supabase/policies.sql` to set up Row Level Security

4. **Create Supabase Storage bucket**
   - In Supabase Dashboard, go to Storage
   - Create a bucket named `documents` with private access
   - This will store signatures and medical documents

5. **Import n8n workflows**
   - Open your n8n instance
   - Import each JSON file from the `n8n/` directory
   - Configure credentials for Supabase, WhatsApp, and CRM APIs
   - Activate the workflows

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

### Create Deployment Package

```bash
node setup-enterprise.mjs zip
```

This creates `Himam-System-Full.zip` ready for deployment.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Add all environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Add all environment variables
4. Deploy

## 🔐 Security Features

- **Authentication**: Supabase Auth with JWT and role-based access
- **Encryption**: SSL enforced; all API endpoints over HTTPS
- **Privacy**: Patient-doctor communications end-to-end encrypted via WhatsApp API
- **Storage**: All files in Supabase Storage under secure private buckets
- **RLS**: Row Level Security enabled on all database tables

## 📱 Features

### Patient Management
- Patient registration and profile management
- Booking system with specialist selection
- Session history and medical records
- Secure communication with specialists

### Admin Dashboard
- CMS for managing site content
- Patient and specialist management
- Appointment scheduling
- Report generation

### AI Assistant
- Smart responses using Gemini Pro or GPT-4 Turbo
- Arabic and English language support
- Medical knowledge base integration
- Automated SOAP note generation

### WhatsApp Integration
- Automated booking confirmations
- Appointment reminders
- Secure patient-specialist messaging
- AI-powered auto-responses

### Calendar Integration
- Google Calendar event creation
- Google Meet video consultation links
- Automated scheduling
- Reminder notifications

### eSignature
- Digital signature capture
- Secure document signing
- Signature verification and storage
- Legal compliance

## 🔧 API Endpoints

- `POST /api/ai` - AI-powered responses (Gemini/OpenAI)
- `POST /api/whatsapp` - WhatsApp webhook handler
- `POST /api/crm` - CRM synchronization
- `POST /api/calendar` - Google Calendar event creation
- `POST /api/signature` - Digital signature processing
- `GET /api/patients` - Fetch patient data
- `POST /api/patients` - Create new patient

## 📊 Database Schema

### Tables
- `patients` - Patient information
- `specialists` - Medical specialists
- `sessions` - Medical sessions and appointments
- `admins` - Admin users
- `cms_content` - CMS content management

All tables have Row Level Security (RLS) enabled with appropriate policies.

## 🔄 n8n Workflows

1. **Booking Workflow** - Handles new bookings, creates patient records, schedules via Google Calendar
2. **Billing Workflow** - Calculates billing, syncs with CRM
3. **AI Response Workflow** - Connects to Gemini/OpenAI for smart auto-replies
4. **Signature Workflow** - Handles signed consent and report archiving
5. **CRM Sync Workflow** - Updates CRM and insurance API with session data

## 🌐 Pages

- `/` - Landing page with hero, specialists, and booking form
- `/patients` - Patient dashboard with session history
- `/dashboard/admin` - Admin CMS dashboard
- `/sign` - Electronic signature page

## 📝 License

Proprietary - Al-Himam Medical Center, Jeddah, Saudi Arabia

## 🤝 Support

For support and inquiries, contact: info@al-himam.com.sa

## 📄 Version

Version 1.0.0 - Enterprise Release
