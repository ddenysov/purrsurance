# Appointments Feature

This document describes the new Veterinary Appointments feature added to the Purrsurance application.

## Overview

The Appointments feature allows users to view all veterinary appointments from the `VetAppointments` DynamoDB table through a modern web interface.

## Components

### 1. Backend Service (`service-backend`)

**Location:** `/apps/services/service-backend/`

A Lambda function that provides REST API endpoint to retrieve veterinary appointments data.

**Key files:**
- `app.mjs` - Lambda handler
- `template.yaml` - AWS SAM infrastructure
- `package.json` - Dependencies
- `deploy.sh` - Deployment script

**Endpoint:**
- `GET /vet-appointments` - Returns all appointments in JSON format

**Response format:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "appointmentId": "APPT-2025-001001",
      "policyId": "POL-2025-123456",
      "status": "scheduled",
      "pet": { ... },
      "owner": { ... },
      "clinic": { ... },
      "appointment": { ... }
    }
  ],
  "timestamp": "2024-10-14T12:00:00.000Z"
}
```

**CORS Configuration:**
- All origins (`*`)
- All headers (`*`)
- All methods (`*`)

### 2. Frontend Page (`appointments.vue`)

**Location:** `/apps/frontend/app/pages/appointments.vue`

A Vue.js page that displays appointments in a beautiful table format.

**Features:**
- Loading state with spinner
- Error handling with retry button
- Responsive table design
- Status badges (scheduled, confirmed, completed, cancelled)
- Appointment type badges (routine, specialist, urgent, emergency)
- Automatic date/time formatting
- Refresh button
- Navigation menu

**Design:**
- Gradient background: `from-mint-50 to-brand-50`
- Color scheme: Mint (green) and Brand (pink)
- Modern UI with backdrop blur effects
- Hover animations
- Responsive layout

## Setup & Deployment

### Backend Service

1. **Install dependencies:**
   ```bash
   cd apps/services/service-backend
   npm install
   ```

2. **Build:**
   ```bash
   sam build
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh
   # Or manually:
   sam deploy
   ```

4. **Get API URL:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name service-backend \
     --query 'Stacks[0].Outputs[?OutputKey==`BackendApiUrl`].OutputValue' \
     --output text
   ```

### Frontend Configuration

1. **Update environment variable:**
   
   After deploying the backend, update the frontend `.env` file:
   ```bash
   NUXT_PUBLIC_BACKEND_API_URL=https://YOUR_API_GATEWAY_URL/Prod/vet-appointments
   ```

2. **For local development:**
   
   The Vite proxy is already configured in `nuxt.config.ts`:
   ```javascript
   '/api/vet-appointments': {
     target: process.env.NUXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000',
     changeOrigin: true,
     rewrite: (path) => path.replace(/^\/api/, ''),
   }
   ```

## Navigation

The application now has a unified navigation bar across all pages:

- **Chat Page** (`/`) - Main chat interface
- **Appointments** (`/appointments`) - Veterinary appointments list
- **Admin** (`/admin`) - Pets management panel

Each page has quick links to navigate between sections.

## Local Development

### Start Backend API locally:
```bash
cd apps/services/service-backend
./test-local.sh
# API will be available at http://localhost:3000/vet-appointments
```

### Start Frontend:
```bash
cd apps/frontend
pnpm dev
# Navigate to http://localhost:3001/appointments
```

## API Integration

The frontend fetches data using the native `fetch` API:

```javascript
const response = await fetch(backendApiUrl)
const data = await response.json()

if (data.success && Array.isArray(data.data)) {
  appointments.value = data.data
}
```

## Styling

The appointments page follows the project's design system:

**Colors:**
- Mint: `#22c55e` (primary green)
- Brand: `#ec4899` (primary pink)
- Gray scale for text and backgrounds

**Components:**
- Glass-morphism cards (`backdrop-blur-md`)
- Rounded corners (`rounded-2xl`)
- Subtle shadows
- Smooth transitions

## Database Schema

The `VetAppointments` table stores:

- **Primary Key:** `appointmentId`
- **Indexes:**
  - `PolicyIdIndex` - Query by policy
  - `PetIdIndex` - Query by pet
  - `StatusIndex` - Query by status

**Main fields:**
- Pet information (name, species, breed, weight)
- Owner information (name, phone, email, address)
- Clinic details (name, address, specialty)
- Appointment details (type, reason, date, duration)
- Medical context (optional)
- Status (scheduled, confirmed, completed, cancelled)

## Future Enhancements

Possible improvements:
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Search functionality
- [ ] Export to CSV/PDF
- [ ] Appointment creation form
- [ ] Appointment editing
- [ ] Cancellation workflow
- [ ] Email/SMS notifications
- [ ] Calendar view
- [ ] Pet-specific appointment history

## Troubleshooting

### Backend API not responding
1. Check if Lambda is deployed
2. Verify API Gateway endpoint
3. Check CloudWatch logs:
   ```bash
   sam logs --stack-name service-backend --tail
   ```

### Frontend shows error
1. Check browser console for errors
2. Verify `NUXT_PUBLIC_BACKEND_API_URL` is set correctly
3. Check CORS headers in response
4. Ensure DynamoDB table has data

### CORS errors
- The backend is configured with wildcard CORS (`*`)
- If issues persist, check API Gateway CORS settings
- Verify response headers include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Headers: *`
  - `Access-Control-Allow-Methods: *`

## Notes

- The backend uses AWS SAM for infrastructure
- The frontend uses Nuxt 3 + Vue 3 + TypeScript
- Data is read-only (no create/update/delete operations yet)
- All appointments are fetched at once (pagination can be added later)
- TypeScript errors in `index.vue` are pre-existing and unrelated to this feature

