# CERT Framework Second Beta Test - Dashboard Standalone Analysis

**Tester:** Claude (AI Assistant)
**Date:** 2025-11-23
**Version Tested:** CERT Framework v4.0.0
**Test Focus:** Dashboard as a Standalone No-Code Management Application
**Dashboard URL:** https://dashboard.cert-framework.com/

---

## Executive Summary

This second beta test evaluates the CERT Framework dashboard's capability to function as a **standalone no-code management application**. The goal is to identify what architectural and feature gaps exist that prevent users from managing their AI monitoring and compliance projects entirely through the dashboard UI, without writing code.

### Key Finding

The current dashboard is primarily a **visualization and analysis tool**, not a management platform. Users can:
- **View** metrics, costs, health, and quality data
- **Analyze** uploaded trace files
- **Configure** some thresholds and settings
- **Plan** implementations via the wizard

However, they **cannot**:
- Create and manage projects
- Configure connectors/integrations
- Set up alerts and notifications
- Generate compliance documents
- Manage users and teams
- Automate data collection

---

## Current Dashboard Capabilities Assessment

### What Works (No-Code)

| Feature | Page | Status | Notes |
|---------|------|--------|-------|
| View system metrics | `/` | ✅ Working | Cost, Health, Quality KPIs with auto-refresh |
| Time window filtering | `/` | ✅ Working | Hour, Day, Week, Month |
| Cost breakdown | `/costs` | ✅ Working | By model, by platform (requires file upload) |
| Live monitoring view | `/monitoring` | ✅ Working | Real-time trace table with filtering |
| Compliance status view | `/compliance` | ✅ Working | EU AI Act article compliance overview |
| ROI Calculator | `/wizard` | ✅ Working | Interactive business case builder |
| Risk Classifier | `/wizard` | ✅ Working | EU AI Act Annex III questionnaire |
| Architecture Selector | `/wizard` | ✅ Working | Tech stack recommendations |
| Readiness Assessment | `/wizard` | ✅ Working | Team/org readiness scoring |
| Settings configuration | `/settings` | ✅ Partial | Metrics thresholds only |
| View connectors info | `/connectors` | ✅ Working | Shows available connectors (read-only) |

### What Requires Code

| Feature | Current State | Impact |
|---------|--------------|--------|
| Connector Setup | Requires Python installation and `pip install` | HIGH |
| API Key Configuration | Environment variables only | HIGH |
| Data Collection | Must run Python SDK in application | HIGH |
| Alert Configuration | Code-based in `cert/observability/alerting/` | MEDIUM |
| Custom Evaluations | Requires Python evaluation code | MEDIUM |
| Report Generation | CLI command `cert report` or Python | MEDIUM |
| Compliance Documentation | CLI command `cert generate` | MEDIUM |

---

## Missing Features for No-Code Standalone Operation

### Category 1: Project & Workspace Management (Critical)

**Current State:** No concept of projects or workspaces

**Required Features:**

1. **Project CRUD**
   - Create new project from dashboard
   - Configure project-level settings
   - View project overview and stats
   - Archive/delete projects

2. **Multi-Project Support**
   - Switch between projects
   - Project-level API keys
   - Project-level user permissions
   - Cross-project analytics

3. **Environment Management**
   - Development / Staging / Production environments
   - Environment-specific configurations
   - Easy environment switching

**Architecture Gap:**
```
Current:  Dashboard → API Server → Single trace file
Required: Dashboard → API Server → Database → Multi-tenant project storage
```

### Category 2: Connector & Integration Setup (Critical)

**Current State:** Connectors page shows information but setup requires code

**Required Features:**

1. **Visual Connector Wizard**
   - Step-by-step connector setup
   - API key input (encrypted storage)
   - Connection testing from UI
   - Health check from dashboard

2. **OAuth Integration**
   - OAuth flows for services (Slack, GitHub, etc.)
   - Token refresh handling
   - Connection status monitoring

3. **Webhook Configuration**
   - Inbound webhook URLs for receiving data
   - Webhook secret generation
   - Payload preview and testing

4. **Agent Installation**
   - Generate installation snippets
   - Copy-paste SDK initialization code
   - Installation verification from dashboard

**Architecture Gap:**
```
Current:  Environment variables for API keys, no dashboard management
Required: Secure credential storage, key-value secrets management, connection registry
```

### Category 3: Data Source Management (Critical)

**Current State:** Requires manual file upload or running API server locally

**Required Features:**

1. **Cloud Data Source Connections**
   - S3/GCS bucket integration
   - Database connections (PostgreSQL, MongoDB)
   - File sync from cloud storage

2. **Real-time Data Streaming**
   - WebSocket-based trace ingestion
   - Trace collector endpoint URL
   - Stream health monitoring

3. **Data Import/Export**
   - Bulk trace import from files
   - Export traces to various formats
   - Scheduled data backups

4. **Trace Collector Service**
   - Managed trace collector endpoint
   - No self-hosting required
   - Auto-scaling trace ingestion

**Architecture Gap:**
```
Current:  Client-side file parsing only
Required: Server-side data ingestion, persistent storage, real-time streaming
```

### Category 4: User & Access Management (High Priority)

**Current State:** No authentication or user management

**Required Features:**

1. **Authentication**
   - Email/password login
   - SSO integration (Google, Microsoft, SAML)
   - 2FA support
   - Session management

2. **Role-Based Access Control**
   - Admin / Editor / Viewer roles
   - Project-level permissions
   - Feature-level access control

3. **Team Management**
   - Invite team members
   - Remove/deactivate users
   - Transfer project ownership
   - Activity audit logs

4. **API Key Management**
   - Generate project API keys from dashboard
   - Key rotation
   - Key usage analytics
   - Revoke keys

**Architecture Gap:**
```
Current:  No authentication layer
Required: Auth service (Auth0, Clerk, or custom), user database, session management
```

### Category 5: Alert & Notification Configuration (High Priority)

**Current State:** Settings page has toggles but no actual configuration

**Required Features:**

1. **Alert Rule Builder**
   - Visual alert condition builder
   - Threshold configuration per metric
   - Alert severity levels
   - Alert scheduling (working hours, etc.)

2. **Notification Channels**
   - Email integration
   - Slack integration
   - PagerDuty integration
   - Webhook destinations

3. **Alert Management**
   - View active alerts
   - Acknowledge alerts
   - Snooze alerts
   - Alert history

4. **Escalation Policies**
   - Define escalation chains
   - Timeout-based escalation
   - On-call schedules

**Architecture Gap:**
```
Current:  Alert toggles in settings (non-functional)
Required: Alert engine, notification service, integration with external channels
```

### Category 6: Compliance Document Management (High Priority)

**Current State:** Can view compliance status but not generate documents

**Required Features:**

1. **Document Generation**
   - Generate compliance documents from dashboard
   - Select document templates
   - Fill in required fields interactively
   - Preview before download

2. **Template Management**
   - Pre-built templates for EU AI Act
   - Custom template creation
   - Template versioning

3. **Document Storage**
   - Store generated documents
   - Version history
   - Revision tracking

4. **Approval Workflows**
   - Document review workflow
   - Approval/rejection tracking
   - Digital signatures
   - Audit trail

**Architecture Gap:**
```
Current:  CLI-based document generation
Required: Document storage, template engine in API, workflow engine
```

### Category 7: Report Management (Medium Priority)

**Current State:** No report functionality in dashboard

**Required Features:**

1. **Report Builder**
   - Select metrics and date ranges
   - Choose report format (PDF, Word, Excel)
   - Custom sections and charts

2. **Scheduled Reports**
   - Daily/weekly/monthly reports
   - Email delivery
   - Report history

3. **Report Templates**
   - Save report configurations
   - Share templates across projects
   - Template library

4. **Export & Sharing**
   - Download reports
   - Share via link (with expiry)
   - Embed in other tools

**Architecture Gap:**
```
Current:  No report generation
Required: Report template engine, PDF generation service, scheduler
```

### Category 8: API & SDK Management (Medium Priority)

**Current State:** API documentation exists but no management UI

**Required Features:**

1. **API Explorer**
   - Interactive API documentation
   - Try endpoints from browser
   - Code generation for various languages

2. **SDK Installation Guide**
   - Per-project installation instructions
   - Automatically include project API key
   - Copy-paste ready code

3. **Usage Analytics**
   - API call volume
   - Error rates by endpoint
   - Rate limiting configuration

**Architecture Gap:**
```
Current:  Static API documentation
Required: Interactive API explorer, usage tracking, per-project keys
```

---

## Proposed Architecture for Standalone Dashboard

### Current Architecture (View-Only)

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌────────────┐ │
│  │   Dashboard  │─────▶│   API Server │─────▶│ JSONL File │ │
│  │   (Next.js)  │      │   (FastAPI)  │      │  (Local)   │ │
│  └──────────────┘      └──────────────┘      └────────────┘ │
│         │                     │                              │
│         │                     ▼                              │
│         │              ┌──────────────┐                      │
│         └─────────────▶│ File Upload  │                      │
│                        │ (Client-side)│                      │
│                        └──────────────┘                      │
│                                                               │
│  User Application (Separate)                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  @trace decorator → cert_traces.jsonl → Manual upload   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Architecture (Standalone Management)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Proposed Standalone Architecture                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐   │
│  │   Dashboard  │─────▶│   API Server │─────▶│     PostgreSQL       │   │
│  │   (Next.js)  │      │   (FastAPI)  │      │   (Multi-tenant)     │   │
│  └──────────────┘      └──────┬───────┘      └──────────────────────┘   │
│         │                     │                                          │
│         │              ┌──────┴──────┐                                   │
│         │              │             │                                   │
│         │              ▼             ▼                                   │
│         │       ┌─────────────┐ ┌─────────────────┐                     │
│         │       │    Redis    │ │  Secret Store   │                     │
│         │       │  (Cache/RT) │ │ (Vault/AWS SM)  │                     │
│         │       └─────────────┘ └─────────────────┘                     │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        New Services                               │    │
│  ├────────────────┬────────────────┬────────────────┬──────────────┤    │
│  │   Auth Service │  Alert Engine  │ Doc Generator  │  Ingestion   │    │
│  │   (Clerk/Auth0)│  (Scheduler)   │ (PDF/DOCX)     │  (WebSocket) │    │
│  └────────────────┴────────────────┴────────────────┴──────────────┘    │
│                                                                           │
│  User Application                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  SDK → HTTPS/WebSocket → Trace Collector → Dashboard (auto)     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (4-6 weeks)

**Goal:** Enable basic no-code project management

| Feature | Effort | Priority |
|---------|--------|----------|
| Database integration (PostgreSQL) | 1 week | Critical |
| Authentication system (Clerk/Auth0) | 1 week | Critical |
| Project CRUD from dashboard | 1 week | Critical |
| Managed trace ingestion endpoint | 2 weeks | Critical |
| API key generation from dashboard | 0.5 week | High |

**Deliverables:**
- Users can create accounts
- Users can create projects from dashboard
- Users can get project API key
- SDK can send traces to managed endpoint

### Phase 2: Configuration (3-4 weeks)

**Goal:** Enable no-code configuration of all features

| Feature | Effort | Priority |
|---------|--------|----------|
| Connector configuration UI | 1 week | High |
| Secure credential storage | 1 week | High |
| Alert rule builder | 1 week | High |
| Notification channel setup | 0.5 week | High |
| Settings persistence | 0.5 week | Medium |

**Deliverables:**
- Users can configure connectors from dashboard
- Users can set up alerts from dashboard
- Users can connect notification channels

### Phase 3: Automation (3-4 weeks)

**Goal:** Enable automated workflows without code

| Feature | Effort | Priority |
|---------|--------|----------|
| Document generation from dashboard | 1.5 weeks | High |
| Report builder and scheduler | 1 week | Medium |
| Real-time WebSocket streaming | 1 week | Medium |
| Webhook management | 0.5 week | Medium |

**Deliverables:**
- Users can generate compliance docs from dashboard
- Users can schedule automated reports
- Dashboard updates in real-time

### Phase 4: Scale (2-3 weeks)

**Goal:** Multi-user and enterprise features

| Feature | Effort | Priority |
|---------|--------|----------|
| Role-based access control | 1 week | Medium |
| Team management | 0.5 week | Medium |
| Audit logging | 0.5 week | Medium |
| Multi-environment support | 1 week | Low |

**Deliverables:**
- Teams can collaborate on projects
- Enterprise security and compliance

---

## Specific Dashboard Page Improvements

### 1. Home Page (`/`)

**Current:** Shows metrics (view-only)

**Needed:**
- Project selector dropdown
- Quick action buttons: "Add Connector", "Create Alert", "Generate Report"
- Onboarding checklist for new users
- System health status indicator

### 2. Connectors Page (`/connectors`)

**Current:** Shows connector information (read-only)

**Needed:**
```
┌────────────────────────────────────────────────────────┐
│  Connectors                              [+ Add New]   │
├────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐ │
│  │  OpenAI                        ● Connected        │ │
│  │  API Key: sk-...***             [Configure]       │ │
│  │  Last trace: 2 minutes ago      [Test] [Remove]   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Anthropic                     ○ Not configured   │ │
│  │                                 [Set Up →]        │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 3. Settings Page (`/settings`)

**Current:** Has sections but many are non-functional placeholders

**Needed:**
- Fully functional API Keys section (generate, copy, revoke)
- Fully functional Integrations section (OAuth flows)
- Project-level settings
- Billing management (for SaaS)

### 4. New Pages Needed

| Page | Purpose |
|------|---------|
| `/projects` | Project list and management |
| `/projects/[id]/settings` | Project-specific settings |
| `/team` | Team member management |
| `/alerts` | Alert configuration and history |
| `/reports` | Report generation and history |
| `/documents` | Generated compliance documents |
| `/onboarding` | New user setup wizard |

---

## Technical Requirements

### Backend Changes

1. **Database Schema**
   ```sql
   -- Core entities
   users, projects, project_members, api_keys

   -- Configuration
   connectors, alert_rules, notification_channels

   -- Data storage
   traces, metrics_snapshots, evaluations

   -- Compliance
   documents, document_versions, approvals
   ```

2. **API Endpoints (New)**
   ```
   POST   /api/projects
   GET    /api/projects
   PUT    /api/projects/:id
   DELETE /api/projects/:id

   POST   /api/connectors
   PUT    /api/connectors/:id/test
   DELETE /api/connectors/:id

   POST   /api/alerts
   GET    /api/alerts
   PUT    /api/alerts/:id

   POST   /api/documents/generate
   GET    /api/documents

   POST   /api/ingest  # Trace ingestion endpoint
   ```

3. **Infrastructure**
   - PostgreSQL for persistent storage
   - Redis for caching and real-time features
   - Secret management (AWS Secrets Manager, HashiCorp Vault)
   - Background job queue (Celery, Bull)

### Frontend Changes

1. **State Management**
   - Project context provider
   - User authentication state
   - Real-time updates via WebSocket

2. **New Components**
   - ProjectSelector
   - ConnectorSetupWizard
   - AlertRuleBuilder
   - DocumentGenerator
   - TeamManagement

3. **API Client**
   - Authenticated API client
   - Error handling with retry
   - Optimistic updates

---

## Comparison: Current vs. Needed

| Capability | Current | Needed | Gap |
|------------|---------|--------|-----|
| Create project | No | Yes | Dashboard UI + API + DB |
| Configure connector | No | Yes | Secure storage + wizard |
| View metrics | Yes | Yes | - |
| Set up alerts | No | Yes | Alert engine + UI |
| Generate documents | No | Yes | Template engine + UI |
| Manage team | No | Yes | Auth + RBAC |
| Schedule reports | No | Yes | Scheduler + email |
| Real-time updates | Partial | Yes | WebSocket |
| User authentication | No | Yes | Auth service |
| API key management | No | Yes | Key rotation + UI |

---

## Recommendations

### Immediate (Phase 1 MVP)

1. **Add authentication** - Use Clerk or Auth0 for quick implementation
2. **Add project model** - Simple database table with project metadata
3. **Create trace ingestion endpoint** - Replace file-based with HTTP endpoint
4. **Generate API keys from dashboard** - Simple key generation UI

### Short-term (Phase 2)

5. **Connector configuration UI** - Visual setup for each provider
6. **Alert rule builder** - Simple threshold-based alerts
7. **Document generation** - PDF/Word export from dashboard

### Medium-term (Phase 3-4)

8. **Team management** - Invite users, assign roles
9. **Real-time streaming** - WebSocket-based live updates
10. **Scheduled reports** - Automated report generation and delivery

---

## Conclusion

The CERT Framework dashboard is currently a **monitoring and analysis tool** that requires significant technical knowledge to set up and operate. To become a **standalone no-code management platform**, it needs:

1. **Authentication & Authorization** - User accounts and access control
2. **Project Management** - Multi-project support with isolation
3. **Self-Service Configuration** - Visual setup for connectors, alerts, and integrations
4. **Managed Data Ingestion** - Automatic trace collection without self-hosting
5. **Document & Report Generation** - Compliance output directly from UI

The estimated effort for a full no-code standalone dashboard is approximately **12-17 weeks** of development, broken into 4 phases prioritized by user impact.

The core value proposition (EU AI Act compliance + LLM monitoring) is strong. Wrapping it in a self-service dashboard would significantly lower the barrier to adoption and enable non-technical users (compliance officers, product managers) to use the framework independently.

---

**Testing completed:** 2025-11-23
**Report generated by:** Claude (Anthropic)
