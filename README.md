# Himam Enterprise AI System v2.0.0

Enterprise-grade unified automation platform for Himam Medical Center.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
# Execute supabase/schema.sql in Supabase SQL Editor

# Start development server
npm run dev
```

## 📚 Documentation

- [Enterprise System Guide](./docs/ENTERPRISE_SYSTEM_README.md)
- [Flow Diagram](./docs/FLOW_DIAGRAM.md)
- [WhatsApp Integration](./docs/WHATSAPP_INTEGRATION_GUIDE.md)

## ✨ Features

- 🤖 AI-Powered WhatsApp Automation (Gemini 2.0 Flash + OpenAI)
- 📅 Google Calendar Integration
- 💼 CRM Synchronization
- 💳 Billing Management
- ✍️ Digital Signatures
- ⚙️ Dynamic Configuration (Supabase Settings)

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash + OpenAI GPT-4o-mini
- **Messaging**: Meta WhatsApp Cloud API
- **Calendar**: Google Calendar API
- **Storage**: Supabase Storage

## 📖 Key Components

- `/app/api` - API routes for all integrations
- `/src/lib` - Core services (AI, Calendar, Config)
- `/supabase/functions` - Edge Functions
- `/app/settings` - Unified settings management

## 🔧 Configuration

All system configuration is managed through the `/settings` page and stored in Supabase `settings` table.

## 📝 License

Proprietary - Himam Medical Center

---

**Status**: Production Ready ✅


