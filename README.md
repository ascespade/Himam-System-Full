# Himam Enterprise AI System v2.0.0

Enterprise-grade unified automation platform for Himam Medical Center.

## 🚀 Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/himam-system.git
    cd himam-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    ```bash
    cp .env.example .env.local
    # Edit .env.local with your actual values
    ```

4.  **Run development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**
    Navigate to `http://localhost:3000`

## 📦 Deployment

### Production Deployment to Vercel

For complete deployment instructions, see **[DEPLOYMENT.md](DEPLOYMENT.md)**

**Quick deployment steps**:

1.  **Set up Supabase database**
    -   Create Supabase project
    -   Run `supabase/complete_schema.sql` in SQL Editor
    -   Create `documents` storage bucket

2.  **Deploy to Vercel**
    -   Connect GitHub repository
    -   Add environment variables (see `.env.example`)
    -   Deploy

3.  **Verify deployment**
    -   Test all pages load correctly
    -   Check API endpoints work
    -   Verify data displays

For detailed step-by-step instructions, troubleshooting, and post-deployment verification, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## 📁 Project Structure

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


