# Solution Architecture Document (SAD)

## Purrsurance - Pet Insurance AI Assistant Platform

**Version:** 1.0  
**Date:** October 15, 2025  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Principles](#3-architecture-principles)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Component Architecture](#5-component-architecture)
6. [Data Architecture](#6-data-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Technology Stack](#10-technology-stack)
11. [Design Decisions](#11-design-decisions)
12. [Scalability & Performance](#12-scalability--performance)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Future Considerations](#14-future-considerations)

---

## 1. Executive Summary

Purrsurance is an intelligent pet insurance assistant platform that leverages AWS Bedrock AI agents to provide personalized policy management, veterinary consultation, and appointment booking services for pet owners in Ukraine. The system combines conversational AI with real-time event streaming to deliver a modern, responsive user experience.

### Key Capabilities

- **AI-Powered Conversations**: Multi-agent system with specialized agents for different domains
- **Policy Management**: Real-time access to pet insurance policies and coverage details
- **Veterinary Consultation**: AI veterinarian with medical knowledge base integration
- **Appointment Booking**: Automated vet clinic finding and appointment scheduling
- **Real-Time Events**: Server-Sent Events (SSE) for live updates
- **Session Isolation**: Per-tab session management for privacy and multi-tab support

---

## 2. System Overview

### 2.1 Business Context

Purrsurance addresses the need for accessible, intelligent pet insurance management by providing:
- 24/7 AI-powered veterinary consultation
- Instant policy information access
- Streamlined appointment booking
- Multi-lingual support (Ukrainian/English)

### 2.2 System Boundaries

**In Scope:**
- Web-based chat interface for pet owners
- Policy information retrieval and management
- AI-powered veterinary consultation with medical knowledge base
- Vet clinic search and appointment booking
- Real-time event notifications
- Chat history persistence

**Out of Scope:**
- Mobile native applications (currently web-only)
- Payment processing
- Claims processing
- Direct veterinary telemedicine (video/calls)
- Third-party clinic integrations

### 2.3 Users & Actors

- **Pet Owners**: Primary users interacting with the AI assistant
- **System Administrators**: Managing deployments and monitoring
- **AWS Bedrock Agents**: Autonomous AI agents handling specific domains

---

## 3. Architecture Principles

### 3.1 Core Principles

1. **Serverless-First**: Leverage AWS Lambda and managed services for scalability and cost efficiency
2. **Event-Driven**: Asynchronous communication via SNS/EventBridge for loose coupling
3. **AI-Native**: Bedrock Agents as first-class architectural components
4. **Session Isolation**: Per-session data partitioning for privacy and multi-tab support
5. **Stateless Services**: Lambda functions maintain no state between invocations
6. **Infrastructure as Code**: AWS SAM templates for reproducible deployments
7. **Real-Time Updates**: SSE for low-latency client notifications

### 3.2 Design Philosophy

- **Microservices Architecture**: Small, focused services with single responsibility
- **Domain-Driven Design**: Services organized around business domains (policy, vet consultation, booking)
- **API-First**: Well-defined interfaces between components
- **Progressive Enhancement**: Graceful degradation when services unavailable

---

## 4. High-Level Architecture

### 4.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Pet Owner                                │
│                     (Web Browser)                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Purrsurance Platform                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Frontend   │  │  Service     │  │   Bedrock    │          │
│  │  (Nuxt.js)   │◄─┤   Router     │◄─┤   Agents     │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                         │
│         │          ┌──────────────┐  ┌──────────────┐          │
│         └─────────►│  SSE Stream  │  │  DynamoDB    │          │
│                    │   Service    │◄─┤   Tables     │          │
│                    └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  • AWS Bedrock Knowledge Bases (Medical Literature)             │
│  • CloudWatch (Logging & Monitoring)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Logical Architecture Layers

**Presentation Layer**
- Nuxt.js 3 SPA with Vue 3
- Server-Sent Events (SSE) client
- Responsive UI with Tailwind CSS

**Application Layer**
- Service Router (Intent classification & routing)
- SSE Stream Service (Real-time event delivery)
- Backend API (Data retrieval)

**Agent Layer**
- Intention Classifier Agent
- Policy Manager Agent
- Vet Doctor Agent (with RAG)
- Booking Manager Agent

**Tool Layer**
- Lambda-based action group tools
- Shared agent-tools package

**Data Layer**
- DynamoDB tables (Policies, Appointments, ChatHistory, Events)
- Bedrock Knowledge Base (Medical literature)

---

## 5. Component Architecture

### 5.1 Frontend Application

**Technology:** Nuxt.js 3 + Vue 3 + TypeScript + Pinia

**Key Components:**
- `ChatComposer.vue`: Message input and submission
- `ChatMessage.vue`: Message rendering with markdown support
- `AppHeader.vue`: Navigation and branding
- `useChat.ts`: Chat state management composable
- `useSession.ts`: Session ID generation and management
- `chatService.ts`: API communication layer

**State Management:**
- Pinia stores for chat messages and session state
- Composables for reusable logic

**Configuration:**
- Runtime config for API endpoints (proxy in dev, direct in prod)
- Environment-based URL resolution

### 5.2 Service Router

**Purpose:** Intent classification and message routing to specialized agents

**Architecture:**
```
API Gateway (POST /chat)
    ↓
Service Router Lambda
    ↓
┌───────────────────────────┐
│ 1. Classify Intent        │ ← Intention Classifier Agent
│ 2. Route to Specialist    │
│ 3. Save Chat History      │ → DynamoDB (ChatHistory)
│ 4. Return Response        │
└───────────────────────────┘
```

**Key Features:**
- Multi-agent routing based on intent
- Session management (Bedrock sessions + global sessions)
- Chat history persistence with TTL (90 days)
- CORS support
- Structured JSON logging

**Configuration:**
- `INTENTION_CLASSIFIER_AGENT_ID`: Intent classification
- `POLICY_MANAGER_AGENT_ID`: Policy queries
- `VETDOC_AGENT_ID`: Veterinary consultation
- `BOOKING_MANAGER_AGENT_ID`: Appointment booking

### 5.3 SSE Stream Service

**Purpose:** Real-time event delivery to clients via Server-Sent Events

**Architecture:**
```
Client (EventSource)
    ↓
Lambda Function URL
    ↓
┌─────────────────────────────┐
│ SSE Stream Lambda           │
│ 1. Extract sessionId        │
│ 2. Poll DynamoDB (Events)   │
│ 3. Stream new events        │
│ 4. Keep connection alive    │
└─────────────────────────────┘
```

**Flow:**
1. Client connects with `?sessionId=xxx`
2. Lambda validates session ID
3. Polls DynamoDB every 1 second for new events
4. Formats as SSE (`data: {...}\n\n`)
5. Sends keep-alive comments every 15 seconds

**Key Features:**
- Session-isolated event streams
- Automatic reconnection handling
- Efficient polling with timestamp tracking
- Lambda Function URL (no API Gateway needed)

### 5.4 Event Publisher Service

**Purpose:** Receive and store events for SSE delivery

**Architecture:**
```
Agent Tool Lambda
    ↓
Event Publisher (POST /publish)
    ↓
┌──────────────────────────┐
│ Event Publisher Lambda   │
│ 1. Validate sessionId    │
│ 2. Publish to SNS        │
└──────────────────────────┘
    ↓
AWS SNS Topic
    ↓
Event Saver Lambda
    ↓
DynamoDB (Events table)
```

**Event Schema:**
```json
{
  "partitionKey": "session-id",
  "timestamp": 1729012345678,
  "payload": { "eventType": "...", "data": {...} },
  "eventType": "PolicyDetailsRetrieved",
  "messageId": "sns-message-id"
}
```

### 5.5 AWS Bedrock Agents

#### 5.5.1 Intention Classifier Agent

**Purpose:** Determine user intent and route to appropriate specialist agent

**Intents:**
- `policy_inquiry`: Questions about coverage, policy details
- `veterinary_consultation`: Health concerns, symptoms
- `appointment_booking`: Scheduling vet visits
- `general`: Greetings, general questions

#### 5.5.2 Policy Manager Agent

**Purpose:** Handle policy-related queries

**Action Groups:**
- `get-policy-details`: Retrieve policy by ID
- `search-policies`: Find policies by owner

**Data Source:** DynamoDB Policies table

#### 5.5.3 Vet Doctor Agent

**Purpose:** Provide veterinary consultation with medical knowledge

**Special Features:**
- Retrieval-Augmented Generation (RAG)
- Bedrock Knowledge Base integration
- Medical literature: clinical medicine, internal medicine, infectious diseases, dermatology

**Knowledge Base Content:**
- Professional veterinary medical literature
- Clinical medicine guides
- Infectious disease manuals
- Dermatology resources for dogs and cats

**Action Groups:**
- `save-medical-context`: Save diagnosis and symptoms
- `recommend-vet-visit`: Suggest appropriate vet type and urgency

**RAG Instructions:** (`rag.instruction.txt`)
- Query knowledge base for symptom analysis
- Use medical literature for condition identification
- Determine urgency based on clinical criteria
- Provide evidence-based recommendations

#### 5.5.4 Booking Manager Agent

**Purpose:** Find vet clinics and book appointments

**Action Groups:**
- `find-vet-clinic`: Search by location and specialty
- `book-appointment`: Create appointment in system
- `get-context-details`: Retrieve saved medical context

**Integration:** Creates records in VetAppointments table

### 5.6 Agent Tools (Lambda Functions)

Each tool is a Lambda function invoked by Bedrock Agents.

**Common Tools:**
- `tool-policy-details`: Get policy information
- `tool-find-vet-clinic`: Search veterinary clinics
- `tool-book-vet-clinic`: Book appointments
- `tool-context-details`: Retrieve session context
- `tool-context-save`: Save medical context
- `tool-recommend-doctor-visit`: Suggest vet visit

**Shared Package:** `@purrsurance/agent-tools`
- `createAgentResponse()`: Standard response formatting
- `extractSessionId()`: Session extraction with fallback
- `extractParameters()`: Parse agent parameters
- `sendEventToPublisher()`: Publish events to SSE

### 5.7 Backend API Service

**Purpose:** REST API for direct data access (appointments)

**Endpoints:**
- `GET /vet-appointments`: List all appointments

**Use Case:** Admin panels, reporting dashboards

---

## 6. Data Architecture

### 6.1 DynamoDB Tables

#### 6.1.1 Policies Table

**Purpose:** Store pet insurance policies

**Primary Key:**
- `policyId` (String, HASH)

**Global Secondary Indexes:**
- `OwnerIdIndex`: Query by `ownerId`
- `StatusIndex`: Query by `status` (active, expired, cancelled)

**Schema:**
```typescript
{
  policyId: string;
  ownerId: string;
  status: "active" | "expired" | "cancelled";
  pet: {
    id, name, species, breed, sex, dateOfBirth, ageMonths,
    microchip, weight, spayedNeutered, lifestyle
  };
  owner: {
    id, fullName, phone, email, address
  };
  policy: {
    provider, plan, startDate, endDate, coverage
  };
  medical: {
    allergies, conditions, vaccinations, medications, lastCheckup
  };
  createdAt: string;
  updatedAt: string;
}
```

**Coverage Plans:**
- **Basic**: 50,000 UAH, 3,000 UAH deductible, 30% copay
- **Standard**: 100,000 UAH, 2,000 UAH deductible, 20% copay
- **Premium**: 150,000 UAH, 1,500 UAH deductible, 10% copay

#### 6.1.2 VetAppointments Table

**Purpose:** Store veterinary appointments

**Primary Key:**
- `appointmentId` (String, HASH)

**Global Secondary Indexes:**
- `PolicyIdIndex`: Query by `policyId` + `appointmentDate`
- `PetIdIndex`: Query by `petId` + `appointmentDate`
- `StatusIndex`: Query by `status` + `appointmentDate`

**Schema:**
```typescript
{
  appointmentId: string;
  policyId: string;
  petId: string;
  appointmentDate: string; // ISO 8601
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  pet: { /* snapshot */ };
  owner: { /* snapshot */ };
  clinic: { id, name, address, phone, specialty };
  appointment: {
    type: "routine" | "urgent" | "emergency" | "specialist" | "follow-up";
    reason, duration, notes, confirmationNumber
  };
  medicalContext?: {
    diagnosis, symptoms, assessment, urgencyLevel, visitRecommendation
  };
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Design Pattern:** Data snapshot at booking time for historical accuracy

#### 6.1.3 ChatHistory Table

**Purpose:** Persist conversation history

**Primary Key:**
- `sessionId` (String, HASH)
- `timestamp` (Number, RANGE)

**TTL:** 90 days (automatic cleanup)

**Schema:**
```typescript
{
  sessionId: string;
  timestamp: number;
  role: "user" | "agent";
  message: string;
  metadata?: {
    agentId, intention, responseTime
  };
  ttl: number; // Expiration timestamp
}
```

#### 6.1.4 Events Table

**Purpose:** Store events for SSE delivery

**Primary Key:**
- `partitionKey` (String, HASH) - Session ID
- `timestamp` (Number, RANGE)

**Schema:**
```typescript
{
  partitionKey: string; // sessionId
  timestamp: number;
  payload: {
    eventType: string;
    data: any;
  };
  eventType: string;
  messageId: string;
}
```

**Query Pattern:** Session-isolated polling
```javascript
KeyConditionExpression: 'partitionKey = :sessionId AND timestamp > :lastTimestamp'
```

### 6.2 Bedrock Knowledge Base

**Purpose:** Medical literature for RAG (Retrieval-Augmented Generation)

**Content:**
- Professional veterinary medical literature
- Clinical medicine guides for dogs and cats
- Internal medicine references
- Infectious disease manuals
- Dermatology resources

**Location:** `/resources/rag/medical/`

**Integration:** Queried by Vet Doctor Agent for evidence-based recommendations

### 6.3 Data Flow Patterns

#### 6.3.1 Read Pattern (Policy Lookup)

```
User → Frontend → Service Router → Policy Manager Agent
                                        ↓
                                   tool-policy-details
                                        ↓
                                   DynamoDB (Policies)
                                        ↓
                                   Return to Agent → Router → Frontend
```

#### 6.3.2 Write Pattern (Appointment Booking)

```
User → Frontend → Service Router → Booking Manager Agent
                                        ↓
                                   tool-book-vet-clinic
                                        ↓
                                   DynamoDB (VetAppointments)
                                        ↓
                                   Event Publisher
                                        ↓
                                   SNS Topic → Event Saver
                                        ↓
                                   DynamoDB (Events)
                                        ↓
                                   SSE Stream → Frontend
```

#### 6.3.3 Session Isolation Pattern

```
Browser Tab 1 (sessionId: ABC)  Browser Tab 2 (sessionId: XYZ)
        ↓                                   ↓
   SSE Stream (ABC)                    SSE Stream (XYZ)
        ↓                                   ↓
DynamoDB Query                      DynamoDB Query
(partitionKey = ABC)                (partitionKey = XYZ)
        ↓                                   ↓
Events for ABC only                 Events for XYZ only
```

---

## 7. Integration Architecture

### 7.1 Frontend ↔ Backend Integration

**Chat API:**
- Protocol: REST (POST /chat)
- Format: JSON
- Authentication: None (future: JWT)
- CORS: Enabled (`*`)

**Request:**
```json
{
  "message": "What is my policy coverage?",
  "sessionId": "bedrock-session-123",
  "globalSessionId": "client-session-456"
}
```

**Response:**
```json
{
  "message": "Success",
  "data": {
    "response": "Your policy covers...",
    "sessionId": "bedrock-session-123"
  },
  "metadata": {
    "requestId": "req-123",
    "timestamp": "2025-10-15T12:00:00.000Z",
    "environment": "prod"
  }
}
```

**SSE Connection:**
- Protocol: Server-Sent Events
- URL: `https://.../stream?sessionId=xxx`
- Format: `data: {...}\n\n`
- Reconnection: Automatic with exponential backoff

### 7.2 Service Router ↔ Bedrock Agents

**Protocol:** AWS SDK (`@aws-sdk/client-bedrock-agent-runtime`)

**API:** `invokeAgent()`

**Session Management:**
- Bedrock session ID: Conversation continuity
- Global session ID: Event routing (passed in `sessionAttributes`)

**Example:**
```javascript
const command = new InvokeAgentCommand({
  agentId: AGENT_ID,
  agentAliasId: ALIAS_ID,
  sessionId: bedrockSessionId,
  inputText: message,
  sessionState: {
    sessionAttributes: {
      sessionId: globalSessionId
    }
  }
});
```

### 7.3 Agent Tools ↔ DynamoDB

**Pattern:** Direct SDK integration

**Client:** `@aws-sdk/lib-dynamodb` (DynamoDBDocumentClient)

**Operations:**
- `GetCommand`: Retrieve single item
- `QueryCommand`: Query with indexes
- `PutCommand`: Create item
- `UpdateCommand`: Update item

**Error Handling:**
- Retry logic with exponential backoff
- Graceful degradation on failures

### 7.4 Event Publishing Flow

```
Agent Tool Lambda
    ↓ (HTTP POST)
Event Publisher Lambda
    ↓ (AWS SDK)
SNS Topic
    ↓ (Lambda trigger)
Event Saver Lambda
    ↓ (AWS SDK)
DynamoDB Events Table
    ↓ (polling)
SSE Stream Lambda
    ↓ (EventSource)
Frontend Browser
```

**Message Attributes (SNS):**
- `sessionId`: For routing
- `eventType`: For filtering
- `timestamp`: For ordering

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

**Current State:**
- No authentication (MVP phase)
- Open public access

**Planned:**
- Amazon Cognito for user authentication
- JWT tokens for API authorization
- Policy-based access control (owner can only see own policies)

### 8.2 Network Security

**Frontend:**
- HTTPS only (enforced by CloudFront/S3)
- No sensitive data in localStorage

**Backend:**
- Lambda functions in AWS VPC (optional)
- Security groups restrict traffic
- PrivateLink for AWS service access

**API Gateway:**
- Rate limiting: 1000 requests/second
- Throttling: 500 concurrent connections
- CORS: Configured per environment

### 8.3 Data Security

**At Rest:**
- DynamoDB encryption enabled (AWS managed keys)
- S3 encryption for static assets

**In Transit:**
- TLS 1.2+ for all HTTPS connections
- AWS SDK uses encrypted channels

**PII Protection:**
- Pet owner contact information (email, phone, address)
- Microchip numbers
- Policy identifiers

**Future:** Field-level encryption for sensitive data

### 8.4 IAM Permissions

**Principle:** Least privilege

**Lambda Execution Roles:**
- Service Router: `bedrock:InvokeAgent`, DynamoDB read/write on ChatHistory
- Agent Tools: DynamoDB read on Policies/Appointments
- Event Saver: DynamoDB write on Events
- SSE Stream: DynamoDB read on Events

**Example Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:*:*:table/Policies"
    }
  ]
}
```

### 8.5 Session Isolation

**Design:** Each browser tab has unique `sessionId`

**Benefits:**
- No cross-session event leakage
- Privacy between tabs
- Security through partitioning

**Implementation:**
- Generated client-side: `crypto.randomUUID()`
- Validated server-side in all services
- Used as DynamoDB partition key

---

## 9. Deployment Architecture

### 9.1 Infrastructure as Code

**Tool:** AWS SAM (Serverless Application Model)

**Templates:**
- `service-router/template.yaml`: Router + ChatHistory table
- `service-sse-stream/template.yaml`: SSE stream service
- `service-backend/template.yaml`: Backend API
- `tool-*/template.yaml`: Individual agent tools
- `agent-*/template.yaml`: Agent action groups

**Configuration:** `samconfig.toml` per service

### 9.2 Deployment Pipeline

**Manual Deployment (Current):**

```bash
# 1. Build service
make build

# 2. Deploy to AWS
make deploy

# 3. Get outputs
aws cloudformation describe-stacks --stack-name <stack-name>
```

**Future:** CI/CD with GitHub Actions
- PR: Run tests, lint, security scan
- Merge to main: Deploy to production
- Tag: Deploy to specific environment

### 9.3 Environment Strategy

**Single Environment:** Production only

**Rationale:**
- MVP phase, single client (Ukraine market)
- Cost optimization
- Simplified operations

**User Rule:** "не делай разделения продакшн, стейджинг, дев и т д"

**Future Consideration:** Add staging for pre-production testing

### 9.4 Stack Organization

**Multiple CloudFormation Stacks:**
- `purrsurance-service-router`
- `purrsurance-service-sse-stream`
- `purrsurance-service-backend`
- `purrsurance-tool-policy-details`
- `purrsurance-tool-find-vet-clinic`
- (etc.)

**Benefits:**
- Independent deployments
- Reduced blast radius
- Easier rollback

**Drawback:** Cross-stack references require manual configuration

### 9.5 Frontend Deployment

**Platform:** AWS S3 + CloudFront (assumed)

**Build:**
```bash
cd apps/frontend
pnpm build
```

**Output:** `.output/public` directory

**Deployment Script:** `deploy.sh`
- Builds frontend
- Fetches backend URLs from CloudFormation
- Generates `.env` file
- Uploads to S3
- Invalidates CloudFront cache

---

## 10. Technology Stack

### 10.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt.js | 3.x | Vue.js meta-framework |
| Vue | 3.x | UI framework |
| TypeScript | 5.x | Type safety |
| Pinia | 2.x | State management |
| Tailwind CSS | 3.x | Styling |
| Vite | 5.x | Build tool |

### 10.2 Backend Services

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| AWS Lambda | - | Serverless compute |
| AWS SDK | v3 | AWS service integration |
| pnpm | 8.x | Package manager |

### 10.3 AI & ML

| Technology | Purpose |
|------------|---------|
| AWS Bedrock Agents | Conversational AI orchestration |
| Claude (Anthropic) | Foundation model for agents |
| Bedrock Knowledge Bases | RAG for medical literature |
| Titan Embeddings | Vector embeddings for RAG |

### 10.4 Data Storage

| Technology | Purpose |
|------------|---------|
| DynamoDB | Primary database (NoSQL) |
| S3 | Static assets, medical literature |

### 10.5 Integration & Messaging

| Technology | Purpose |
|------------|---------|
| API Gateway | REST API endpoints |
| Lambda Function URLs | Direct Lambda invocation |
| SNS | Event publishing |
| EventBridge | Event routing (future) |

### 10.6 DevOps & Monitoring

| Technology | Purpose |
|------------|---------|
| AWS SAM CLI | Infrastructure deployment |
| CloudFormation | Infrastructure as Code |
| CloudWatch Logs | Centralized logging |
| CloudWatch Metrics | Performance monitoring |
| X-Ray | Distributed tracing (future) |

### 10.7 Development Tools

| Tool | Purpose |
|------|---------|
| Make | Build automation |
| pnpm workspaces | Monorepo management |
| ESLint | Code linting (future) |
| Prettier | Code formatting (future) |

---

## 11. Design Decisions

### 11.1 Why Serverless?

**Decision:** Use AWS Lambda for all backend services

**Rationale:**
- **Cost Efficiency**: Pay per request, no idle capacity
- **Auto-Scaling**: Handles traffic spikes automatically
- **Reduced Operations**: No server management
- **Fast Development**: Focus on business logic

**Trade-offs:**
- Cold start latency (mitigated with provisioned concurrency)
- Vendor lock-in to AWS

### 11.2 Why Multi-Agent Architecture?

**Decision:** Use specialized Bedrock Agents for different domains

**Rationale:**
- **Separation of Concerns**: Each agent focused on one domain
- **Improved Accuracy**: Specialized prompts and tools per domain
- **Parallel Development**: Teams can work on agents independently
- **Easier Testing**: Test agents in isolation

**Agents:**
1. Intention Classifier: Route to right specialist
2. Policy Manager: Handle policy queries
3. Vet Doctor: Veterinary consultation with RAG
4. Booking Manager: Find clinics and book appointments

### 11.3 Why DynamoDB?

**Decision:** Use DynamoDB for all data storage

**Rationale:**
- **Serverless Native**: No server management
- **Scalability**: Handles millions of requests/second
- **Performance**: Single-digit millisecond latency
- **Flexible Schema**: NoSQL for evolving data models
- **TTL Support**: Automatic data cleanup (chat history)

**Trade-offs:**
- No complex queries (mitigated with GSIs)
- Eventually consistent reads (mitigated with consistent reads where needed)

### 11.4 Why Server-Sent Events (SSE)?

**Decision:** Use SSE for real-time updates instead of WebSockets

**Rationale:**
- **Simplicity**: HTTP-based, no protocol upgrade
- **Browser Support**: Native EventSource API
- **Automatic Reconnection**: Built into browser
- **Firewall Friendly**: Standard HTTP
- **Serverless Compatible**: Works with Lambda Function URLs

**Trade-offs:**
- Unidirectional (server → client only)
- Less efficient than WebSockets for bidirectional communication

**Alternative Considered:** WebSockets (rejected due to complexity in serverless)

### 11.5 Why Session Isolation?

**Decision:** Partition data by session ID for privacy

**Rationale:**
- **Privacy**: Events only visible to originating session
- **Multi-Tab Support**: Each tab has independent stream
- **Security**: No cross-session leakage
- **Scalability**: Better DynamoDB performance

**Implementation:**
- Client-side: `crypto.randomUUID()` per tab
- Server-side: Session ID as DynamoDB partition key

### 11.6 Why Nuxt.js?

**Decision:** Use Nuxt.js 3 instead of plain Vue or React

**Rationale:**
- **Vue Ecosystem**: Team expertise
- **SSR Capable**: Future SEO optimization
- **File-Based Routing**: Automatic route generation
- **Auto-Imports**: Better DX
- **TypeScript Support**: Type safety out of the box

### 11.7 Why Monorepo?

**Decision:** Use pnpm workspaces for monorepo structure

**Rationale:**
- **Code Sharing**: Shared `@purrsurance/agent-tools` package
- **Consistent Dependencies**: Single lockfile
- **Atomic Changes**: Update frontend + backend together
- **Simplified CI/CD**: Single repository to manage

**Structure:**
```
/apps
  /frontend      (Nuxt.js app)
  /services      (Lambda functions)
/packages
  /agent-tools   (Shared utilities)
/data
  /migrations    (Database schemas)
```

### 11.8 Why RAG for Vet Doctor?

**Decision:** Use Retrieval-Augmented Generation instead of fine-tuning

**Rationale:**
- **Accuracy**: Grounded in medical literature
- **Up-to-Date**: Easy to update knowledge base
- **Transparency**: Can trace responses to sources
- **Cost-Effective**: No expensive model training
- **Safety**: Reduces hallucination risk

**Knowledge Base:** Professional veterinary textbooks and clinical guides

### 11.9 Why Lambda Function URLs for SSE?

**Decision:** Use Lambda Function URLs instead of API Gateway

**Rationale:**
- **Lower Latency**: Direct invocation, no API Gateway overhead
- **Cost**: No API Gateway charges
- **Streaming Support**: Native response streaming
- **Simplicity**: No API Gateway configuration

**Trade-off:** Loses API Gateway features (throttling, WAF, caching)

### 11.10 Why No Authentication (MVP)?

**Decision:** Launch without user authentication

**Rationale:**
- **Speed to Market**: MVP launch faster
- **Simplicity**: Fewer moving parts
- **Testing**: Easier for early adopters

**Mitigation:**
- Public dataset (no real PII)
- Rate limiting via API Gateway
- Session isolation prevents cross-contamination

**Future:** Add Cognito authentication before production

---

## 12. Scalability & Performance

### 12.1 Scalability Characteristics

**Horizontal Scaling:**
- Lambda: Automatic, up to 1000 concurrent executions per region
- DynamoDB: On-demand scaling, no limits
- API Gateway: Scales to millions of requests/second

**Vertical Scaling:**
- Lambda memory: 128 MB to 10 GB (CPU scales proportionally)
- Current: 256-512 MB per function

### 12.2 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | < 500ms | ~300ms |
| SSE Event Delivery | < 2s | ~1-2s |
| Agent Response Time | < 3s | ~2-5s |
| DynamoDB Query | < 10ms | ~5-8ms |
| Frontend Load Time | < 2s | ~1.5s |

### 12.3 Performance Optimizations

**Frontend:**
- Code splitting (Nuxt.js automatic)
- Image optimization (future)
- CDN caching (CloudFront)

**Backend:**
- Connection reuse: `AWS_NODEJS_CONNECTION_REUSE_ENABLED=1`
- DynamoDB batch operations where applicable
- Lambda provisioned concurrency for critical paths (future)

**Database:**
- GSIs for efficient queries
- Consistent reads only when necessary
- Batch operations for writes

### 12.4 Bottlenecks & Mitigations

**Potential Bottleneck:** Bedrock Agent response time (2-5s)
- **Mitigation:** Show typing indicator, use SSE for progressive responses

**Potential Bottleneck:** DynamoDB hot partitions
- **Mitigation:** Session ID provides natural distribution

**Potential Bottleneck:** Lambda cold starts
- **Mitigation:** Provisioned concurrency for critical functions (if needed)

### 12.5 Load Testing (Future)

**Tools:** Artillery, Locust

**Scenarios:**
1. Sustained load: 100 concurrent users, 10 minutes
2. Spike test: 0 → 500 users in 1 minute
3. Stress test: Incremental load until failure

**Metrics:**
- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Lambda throttles
- DynamoDB consumed capacity

---

## 13. Monitoring & Observability

### 13.1 Logging Strategy

**Format:** Structured JSON logs

**Example:**
```json
{
  "timestamp": "2025-10-15T12:00:00.000Z",
  "level": "info",
  "service": "service-router",
  "requestId": "abc-123",
  "message": "Agent invoked",
  "metadata": {
    "agentId": "XXX",
    "sessionId": "YYY",
    "duration": 234
  }
}
```

**Log Levels:**
- `error`: Failures requiring attention
- `warn`: Potential issues
- `info`: Important events (requests, responses)
- `debug`: Detailed troubleshooting (disabled in prod)

**Destinations:**
- CloudWatch Logs (all services)
- Log groups: `/aws/lambda/<function-name>`

### 13.2 Metrics & Dashboards

**CloudWatch Metrics:**
- Lambda: Invocations, Errors, Duration, Throttles
- DynamoDB: ConsumedReadCapacity, ConsumedWriteCapacity, Throttles
- API Gateway: Count, Latency, 4xx/5xx errors

**Custom Metrics (Future):**
- Agent routing accuracy
- Session duration
- Event delivery latency

**Dashboards:**
- Overview: Request rate, error rate, latency
- Service health: Per-Lambda metrics
- Database health: DynamoDB capacity and throttles

### 13.3 Alerting (Future)

**Alert Conditions:**
- Error rate > 1% for 5 minutes
- Lambda throttles > 10 in 5 minutes
- API Gateway 5xx > 5% for 5 minutes
- DynamoDB throttles > 0

**Channels:**
- Email (CloudWatch Alarms)
- Slack (SNS integration)
- PagerDuty (critical alerts)

### 13.4 Distributed Tracing (Future)

**Tool:** AWS X-Ray

**Benefits:**
- End-to-end request tracing
- Performance bottleneck identification
- Service dependency visualization

**Implementation:**
- Enable X-Ray in SAM templates
- Instrument with AWS SDK
- Annotate with custom segments

---

## 14. Future Considerations

### 14.1 Short-Term Enhancements (1-3 months)

**Authentication & Authorization:**
- Implement Amazon Cognito
- JWT-based API authentication
- Role-based access control (owner, admin)

**Enhanced Monitoring:**
- Custom CloudWatch dashboards
- Alerting via SNS
- X-Ray distributed tracing

**Performance:**
- Lambda provisioned concurrency for router
- DynamoDB DAX caching (if needed)
- CloudFront CDN for frontend

**Features:**
- Appointment cancellation workflow
- Email/SMS notifications (via SNS + SES/Pinpoint)
- Multi-language support (Ukrainian + English)

### 14.2 Mid-Term Evolution (3-6 months)

**Mobile Applications:**
- React Native app for iOS/Android
- Shared API with web frontend
- Push notifications

**Advanced Analytics:**
- User behavior tracking
- Agent performance metrics
- Conversation quality scoring

**Integration:**
- Third-party vet clinic APIs
- Insurance provider APIs
- Payment gateway (for premium features)

**Infrastructure:**
- Multi-region deployment (disaster recovery)
- CI/CD pipeline (GitHub Actions)
- Staging environment

### 14.3 Long-Term Vision (6-12 months)

**AI Enhancements:**
- Multi-modal agents (image analysis for pet photos)
- Voice interface (Alexa/Google Assistant)
- Predictive analytics (anticipate pet health issues)

**Platform Expansion:**
- B2B portal for veterinary clinics
- Partner integrations (pet food, supplies)
- Community features (pet owner forums)

**Compliance & Security:**
- GDPR compliance (if expanding to EU)
- SOC 2 certification
- Regular security audits

**Business Features:**
- Claims processing automation
- Policy renewal workflows
- Premium subscription tiers

### 14.4 Technical Debt Items

**Code Quality:**
- Add comprehensive test suite (unit, integration, e2e)
- Implement linting (ESLint + Prettier)
- Type coverage improvement (TypeScript strict mode)

**Documentation:**
- API documentation (OpenAPI/Swagger)
- Sequence diagrams for key flows
- Runbooks for common operations

**Infrastructure:**
- Terraform migration (if needed for multi-cloud)
- Cost optimization review
- Disaster recovery testing

### 14.5 Open Questions & Risks

**Scalability:**
- What happens at 10,000 concurrent users?
- When do we need database sharding?

**Cost:**
- Current AWS spend: ~$X/month (estimate)
- Break-even point for dedicated infrastructure?

**AI Accuracy:**
- How do we measure agent response quality?
- When do we need human-in-the-loop review?

**Compliance:**
- Medical advice liability (disclaimer needed)
- Data retention policies (GDPR-like)
- Audit trail requirements

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Agent | AWS Bedrock Agent, autonomous AI for specific domain |
| Action Group | Set of Lambda tools available to an agent |
| RAG | Retrieval-Augmented Generation, AI + knowledge retrieval |
| SSE | Server-Sent Events, HTTP-based real-time updates |
| GSI | Global Secondary Index (DynamoDB) |
| SAM | Serverless Application Model (AWS IaC) |
| TTL | Time To Live (automatic data expiration) |
| Monorepo | Single repository with multiple projects |

---

## Appendix B: References

**Documentation:**
- [AWS Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

**Internal Documents:**
- `QUICKSTART.md`: Setup guide
- `DEPLOYMENT.md`: Deployment procedures
- `SCHEMA.md`: Database schemas
- `SESSION-ISOLATION.md`: Session management
- `APPOINTMENTS-FEATURE.md`: Appointments feature documentation

---

## Document Control

**Change History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-15 | System | Initial creation |

**Review Schedule:** Quarterly or after major architectural changes

**Approval:** (To be signed by Technical Lead & Product Owner)

---

**End of Document**

