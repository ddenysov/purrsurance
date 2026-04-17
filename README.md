# Вет Експерт - AI-Powered Pet Insurance Platform

## Overview

**Вет Експерт** is an intelligent pet insurance management platform that leverages AI agents powered by AWS Bedrock to provide instant policy information, veterinary consultations, and appointment booking through a conversational interface. The platform combines insurance management with AI-driven pet healthcare assistance to deliver a seamless user experience for pet owners.

## Problem Statement

Pet owners often face multiple challenges:
- Understanding complex insurance policies and coverage details
- Determining if their pet's symptoms require immediate veterinary attention
- Finding and booking appointments with appropriate veterinarians
- Accessing reliable veterinary medical information quickly

Вет Експерт solves these problems by providing an intelligent, conversational assistant that can handle insurance inquiries, provide preliminary veterinary assessments, and facilitate appointment booking - all in one place.

## Key Features

### 🤖 Multi-Agent AI System
- **Intention Classifier Agent**: Routes user queries to the appropriate specialized agent
- **Policy Manager Agent**: Retrieves and explains insurance policy details, coverage, claims
- **Vet Doctor Agent**: Provides preliminary health assessments using RAG-enhanced medical knowledge base
- **Booking Manager Agent**: Searches for veterinary clinics and schedules appointments

### 💬 Conversational Interface
- Real-time chat interface with streaming responses
- Server-Sent Events (SSE) for live updates
- Session isolation ensuring privacy across multiple browser tabs
- Context-aware conversations with memory

### 🏥 Veterinary Knowledge Base (RAG)
- Professional veterinary medical literature database
- Clinical medicine guides, internal medicine references
- Infectious disease manuals and dermatology resources
- Evidence-based symptom analysis and urgency assessment

### 📋 Management Dashboard
- Policy information display
- Appointment scheduling and tracking
- Pet and owner information management
- Real-time status updates

## Technology Stack

### Frontend
- **Nuxt.js 3** - Vue 3 framework with TypeScript
- **Tailwind CSS** - Modern, responsive UI styling
- **Pinia** - State management
- **Server-Sent Events** - Real-time event streaming

### Backend & Infrastructure
- **AWS Bedrock** - AI foundation models and agent orchestration
- **AWS Lambda** - Serverless compute for microservices
- **Amazon DynamoDB** - NoSQL database for policies and appointments
- **Amazon SNS** - Event publishing and messaging
- **Amazon EventBridge** - Event routing
- **AWS SAM** - Infrastructure as Code deployment
- **API Gateway** - RESTful API management

### AI & Machine Learning
- **AWS Bedrock Agents** - Multi-agent orchestration
- **Knowledge Bases for Amazon Bedrock** - RAG implementation
- **Claude (Anthropic)** - Large Language Model for conversations
- **Retrieval Augmented Generation (RAG)** - Enhanced medical knowledge retrieval

### Development Tools
- **pnpm** - Fast, disk-efficient package manager
- **Node.js 20.x** - Runtime environment
- **Git** - Version control

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Web Frontend   │
│   (Nuxt.js)     │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌─────────────┐  ┌─────────────┐
│ Service     │  │ SSE Stream  │
│ Router      │  │ Lambda      │
└──────┬──────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────────────────────┐
│   AWS Bedrock Agent         │
│   ┌──────────────────────┐  │
│   │ Intention Classifier │  │
│   └─────────┬────────────┘  │
│             │                │
│   ┌─────────┴────────┐      │
│   │                  │      │
│   ▼                  ▼      │
│ ┌──────────┐  ┌──────────┐ │
│ │ Policy   │  │ Vet Doc  │ │
│ │ Agent    │  │ Agent    │ │
│ └────┬─────┘  └────┬─────┘ │
│      │             │        │
│      │   ┌──────────┐       │
│      │   │ Booking  │       │
│      │   │ Agent    │       │
│      │   └────┬─────┘       │
│      │        │             │
└──────┼────────┼─────────────┘
       │        │
       ▼        ▼
┌─────────────────────────────┐
│     Action Group Tools      │
│ ┌───────────────────────┐   │
│ │ • Policy Details      │   │
│ │ • Context Save/Load   │   │
│ │ • Find Vet Clinic     │   │
│ │ • Book Appointment    │   │
│ │ • Doctor Visit Rec.   │   │
│ └───────────────────────┘   │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │  DynamoDB    │
    │  • Policies  │
    │  • Appts     │
    │  • Events    │
    └──────────────┘
```

### Microservices Architecture

The platform consists of independent, scalable Lambda functions:

**Core Services:**
- `service-router` - Main entry point, orchestrates Bedrock agents
- `service-backend` - REST API for data retrieval
- `service-sse-stream` - Real-time event streaming to clients
- `service-event-publisher` - Publishes events to SNS

**AI Agents:**
- `agent-intention-classifier` - Routes queries to specialized agents
- `agent-policy-manager` - Handles insurance policy queries
- `agent-vet-doctor` - Provides veterinary consultations with RAG
- `agent-booking-manager` - Manages clinic search and appointments

**Action Group Tools:**
- `tool-policy-details` - Retrieves policy information from DynamoDB
- `tool-context-save` / `tool-context-details` - Session context management
- `tool-find-vet-clinic` - Searches for veterinary clinics
- `tool-book-vet-clinic` - Creates appointment bookings
- `tool-recommend-doctor-visit` - Analyzes urgency and recommends care level

## Data Models

### Policies
Insurance policies for pets including:
- Pet information (name, species, breed, age, medical history)
- Owner information (contact details, address)
- Policy details (coverage, limits, deductibles)
- Medical history (conditions, vaccinations, medications)

### Appointments
Veterinary appointments with:
- Appointment details (date, time, duration, type)
- Pet and owner information
- Clinic details (name, address, specialty)
- Status tracking (scheduled, confirmed, completed, cancelled)

### Events
Real-time events for:
- Session-isolated event streams
- Policy updates and claim status
- Appointment confirmations
- Agent responses

## Key Innovations

### 1. Session-Based Event Isolation
Each browser tab receives only its own events through unique session IDs, ensuring privacy and multi-tab support.

### 2. RAG-Enhanced Veterinary Agent
The Vet Doctor agent uses Amazon Bedrock Knowledge Base with professional veterinary literature to provide evidence-based preliminary assessments.

### 3. Multi-Agent Orchestration
Intelligent routing system automatically directs user queries to the most appropriate specialized agent without explicit user selection.

### 4. Serverless Scalability
Fully serverless architecture scales automatically from zero to thousands of concurrent users without infrastructure management.

### 5. Real-Time Conversational Experience
Streaming responses via SSE provide immediate feedback, creating natural conversation flow.

## Use Cases

### 1. Policy Inquiry
**User:** "What does my insurance cover for dental procedures?"  
**Agent:** Policy Manager retrieves coverage details and explains dental benefits, deductibles, and limits.

### 2. Health Concern
**User:** "My cat is vomiting and lethargic since morning"  
**Agent:** Vet Doctor queries medical knowledge base, assesses symptoms, determines urgency, and recommends emergency care.

### 3. Appointment Booking
**User:** "I need to book a vet appointment for my dog next week"  
**Agent:** Booking Manager searches for nearby clinics, shows available slots, and creates appointment.

### 4. Mixed Queries
**User:** "My dog needs vaccination - is it covered and where can I get it?"  
**Agent:** System routes to Policy Manager for coverage info, then to Booking Manager for clinic search.

## Deployment

The platform is deployed entirely on AWS using Infrastructure as Code:

- **Frontend**: Can be deployed to S3 + CloudFront or containerized deployment
- **Backend Services**: AWS SAM templates for Lambda functions
- **Database**: DynamoDB tables with appropriate indexes
- **AI Infrastructure**: AWS Bedrock agents with configured action groups

All services are independently deployable and scalable.

## Security & Privacy

- Session-based isolation for multi-user support
- No hardcoded credentials (IAM roles and policies)
- CORS-enabled APIs for secure frontend communication
- Data encryption at rest (DynamoDB)
- Secure event routing with session validation

## Getting Started

### Prerequisites
- AWS Account with Bedrock access
- Node.js 20.x or higher
- AWS SAM CLI
- pnpm package manager

### Quick Start

1. **Deploy Backend Services**
   ```bash
   make setup
   ```

2. **Configure Frontend**
   ```bash
   cd apps/frontend
   # Update .env with deployed API URLs
   pnpm install
   pnpm dev
   ```

3. **Access Application**
   ```
   http://localhost:3001
   ```

## Conclusion

Вет Експерт demonstrates how modern AI capabilities can transform traditional insurance services into intelligent, conversational experiences. By combining AWS Bedrock's agent orchestration, RAG-enhanced knowledge retrieval, and serverless architecture, the platform delivers a scalable, cost-effective solution for pet insurance management with integrated healthcare guidance.

The multi-agent approach ensures specialized, accurate responses while maintaining a seamless user experience through intelligent routing and real-time streaming. This architecture can be adapted for various insurance domains, healthcare applications, and customer service scenarios.

---

**Built with ❤️ and AWS Bedrock**

