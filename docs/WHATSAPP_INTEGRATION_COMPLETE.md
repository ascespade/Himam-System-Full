# WhatsApp Integration - Complete Documentation

## Overview

The WhatsApp Integration provides automated patient onboarding, appointment reminders, and guardian notifications through WhatsApp Cloud API.

## Features

### 1. Patient Onboarding
- AI-powered data extraction from conversations
- Automatic patient record creation
- Smart appointment booking
- Welcome messages

### 2. Appointment Reminders
- Automated 24-48 hour reminders
- Guardian notifications
- Customizable messages
- Delivery tracking

### 3. Guardian Notifications
- Appointment notifications
- Session completion alerts
- Approval requests
- Status updates

### 4. AI-Powered Responses
- Context-aware responses
- Intent detection
- Data extraction
- Multi-language support

## APIs

### Webhook
- `GET /api/whatsapp` - Webhook verification
- `POST /api/whatsapp` - Message handling

### Guardian
- `POST /api/whatsapp/guardian` - Guardian message handling

## Services

### `src/lib/whatsapp/patient-onboarding.ts`
- Extract patient data from conversations
- Create patient records
- Book appointments

### `src/lib/whatsapp/reminder-system.ts`
- Send appointment reminders
- Batch processing
- Delivery tracking

### `src/lib/whatsapp/guardian-notifications.ts`
- Notify guardians
- Format messages
- Multi-guardian support

## Configuration

### Environment Variables
- `WHATSAPP_ACCESS_TOKEN` - Cloud API token
- `WHATSAPP_PHONE_NUMBER_ID` - Phone number ID
- `WHATSAPP_VERIFY_TOKEN` - Webhook verification token

## Message Types

### Text Messages
- Standard text responses
- Formatted messages
- Multi-line content

### Template Messages
- Pre-approved templates
- Dynamic content
- Interactive buttons

### Media Messages
- Images
- Documents
- Audio (voice notes)

## Workflows

### Patient Registration
1. Patient sends WhatsApp message
2. AI analyzes intent
3. Data extraction
4. Patient record creation
5. Confirmation message
6. Appointment suggestion

### Appointment Reminder
1. Cron job runs (24h before)
2. Check upcoming appointments
3. Send reminder to patient
4. Notify guardians
5. Log delivery

## Integration Points

- Patient Repository - Create/update patients
- Guardian Repository - Get guardian relationships
- Appointment System - Book and manage appointments
- Notification System - Send alerts
