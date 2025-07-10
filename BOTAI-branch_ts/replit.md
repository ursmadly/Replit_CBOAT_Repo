# Clinical Trial Management Bot (cBOAT) Platform

## Overview

The cBOAT (Clinical Bot for Oversight and Analytics in Trials) platform is a comprehensive clinical trial management system designed to automate data quality monitoring, task management, and regulatory compliance. The system leverages AI-powered agents to detect data anomalies, manage tasks, and send notifications across multi-domain clinical trial environments.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **UI Components**: Radix UI with Tailwind CSS for styling
- **Backend**: Express.js with TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Express-session with bcrypt password hashing
- **Email Service**: SendGrid for email notifications
- **AI Integration**: OpenAI API for intelligent analysis
- **Deployment**: Replit with auto-scaling deployment

### Database Architecture
The system uses PostgreSQL with Drizzle ORM for type-safe database operations. Key database schemas include:
- **User Management**: Users, roles, and permissions
- **Trial Management**: Clinical trials, sites, and protocol data
- **Domain Data**: SDTM-compliant clinical data storage
- **Task Management**: Automated task creation and assignment
- **Notification System**: Real-time alerts and email notifications

## Key Components

### Frontend Architecture
- **Single Page Application**: React-based SPA with client-side routing
- **Component Library**: Shadcn/ui components built on Radix UI primitives
- **State Management**: TanStack Query for server state management
- **Theme System**: Dynamic theming with JSON configuration support

### Backend Services
- **Express Server**: RESTful API with middleware for authentication and logging
- **Authentication Middleware**: Session-based authentication with PostgreSQL session store
- **Data Quality Agents**: Automated monitoring and validation systems
- **Email Service**: Bulk email notifications with template support

### AI Agent System
The platform includes specialized AI agents:
- **Central Monitor Bot**: Oversees trial-wide data quality and compliance
- **Data Manager Workflow**: Validates SDTM domain data and creates tasks
- **Task Manager**: Automates task assignment and escalation
- **Signal Detection**: Identifies data anomalies and protocol deviations

## Data Flow

### Domain Data Processing
1. Clinical data is ingested into domain_data tables following SDTM standards
2. AI agents continuously monitor data for quality issues and anomalies
3. Validation rules trigger task creation for data discrepancies
4. Tasks are automatically assigned to appropriate role-based users
5. Email notifications are sent to assigned users and stakeholders

### Task Management Workflow
1. Data quality issues trigger automatic task creation
2. Tasks include context-aware information (domain, source, record ID)
3. Assignment logic considers user roles and trial access permissions
4. Real-time notifications update users on task status changes
5. Email notifications provide detailed task information and action URLs

### Notification System
1. Events trigger notifications through the notification service
2. Role-based targeting ensures relevant users receive appropriate alerts
3. Email templates provide consistent formatting and branding
4. Notification read status tracking prevents duplicate alerts

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage with session management
- **SendGrid**: Email delivery service with API key authentication
- **OpenAI API**: AI-powered analysis and recommendations (optional)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure session encryption key
- `SENDGRID_API_KEY`: SendGrid API authentication
- `SENDGRID_AUTH_MAIL`: Sender email address
- `OPENAI_API_KEY`: OpenAI API access (optional)
- `NODE_ENV`: Environment configuration (development/production)

## Deployment Strategy

### Replit Deployment
- **Build Process**: Vite builds frontend assets, esbuild bundles backend
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Auto-scaling**: Deployment target configured for automatic scaling
- **Port Configuration**: Internal port 5000 mapped to external port 80

### Production Configuration
- **Session Management**: PostgreSQL-backed sessions with secure cookies
- **Proxy Trust**: Configured for deployment behind reverse proxies
- **Environment Security**: Production environment variables managed through platform secrets

### Database Migrations
- **Schema Management**: Drizzle Kit handles database schema changes
- **Migration Scripts**: Automated migration execution during deployment
- **Data Initialization**: Scripts for creating initial domain data and user accounts

## Recent Changes

### June 17, 2025
- **Security Enhancement**: Implemented bcrypt password hashing for secure authentication
- **Admin Features**: Added password change functionality for administrators  
- **UI Cleanup**: Removed development password hints from login page
- **Export System**: Enhanced technical documentation export with diagram capture capabilities

## Changelog

- June 17, 2025. Initial setup with comprehensive clinical trial management system

## User Preferences

Preferred communication style: Simple, everyday language.