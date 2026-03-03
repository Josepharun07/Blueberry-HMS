# Blueberry HMS (Hotel Management Suite)

**Version:** 1.0.0 - Foundation Phase  
**Property:** Blueberry Hills Resort, Munnar (Mattel Group)  
**Domain:** blueberryhillsmunnar.in

## 🏨 Project Overview

Blueberry HMS is a production-grade, self-hosted Hotel Management Operating System built with a modular architecture.

## 🏗 Architecture

- **Modular Monolith** with feature flag system
- **Strict MVC** patterns for security
- **Docker-based** deployment
- **FQDN routing** for all services

## 📦 Technology Stack

- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **Auth:** Keycloak
- **CMS:** Strapi
- **Guest Web:** Next.js
- **Admin Panel:** React + Vite
- **Proxy:** Caddy

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment
docker-compose up -d

# Start all apps
pnpm dev
```
## 🎯 Phase 1: COMPLETE ✅

### Infrastructure
- PostgreSQL database running on port 5432
- Redis cache running on port 6379
- Keycloak authentication on port 8080
- PgAdmin on port 5050

### Core API
- NestJS application on port 4000
- API Documentation: http://localhost:4000/api/docs
- Health Check: http://localhost:4000/api/v1/health

### Modules Implemented
1. **Property Management**
   - CRUD operations for property details
   - Active property selection
   - Settings storage (JSONB)

### Database Schema
```sql
-- Properties table created automatically by TypeORM
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  tagline VARCHAR(500),
  domain_url VARCHAR(100) NOT NULL,
  logo_path VARCHAR,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
