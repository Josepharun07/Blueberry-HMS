================================================================================
                    BLUEBERRY HMS - PROJECT DOCUMENTATION
================================================================================

Project Name: Blueberry Hotel Management Suite (HMS)
Property: Blueberry Hills Resort, Munnar
Owner: Mattel Group
Domain: blueberryhillsmunnar.in
Version: 1.0.0
Current Phase: Phase 2 Complete, Phase 3 Ready to Start
Document Date: March 5, 2026
Status: Production-Ready Core System

================================================================================
                              TABLE OF CONTENTS
================================================================================

1. PROJECT OVERVIEW
2. SYSTEM ARCHITECTURE
3. TECHNOLOGY STACK
4. INSTALLATION & SETUP
5. ENVIRONMENT CONFIGURATION
6. DATABASE SCHEMA
7. API ENDPOINTS
8. SECURITY IMPLEMENTATION
9. PHASE IMPLEMENTATION STATUS
10. FILE STRUCTURE
11. USER ROLES & PERMISSIONS
12. DEVELOPMENT WORKFLOW
13. TESTING PROCEDURES
14. DEPLOYMENT GUIDE
15. TROUBLESHOOTING

================================================================================
                           1. PROJECT OVERVIEW
================================================================================

Blueberry HMS is a complete hotel management operating system designed 
specifically for Blueberry Hills Resort in Munnar, Kerala, India. It is 
built as a modular monolith using modern web technologies with a focus on 
security, scalability, and ease of maintenance.

CORE OBJECTIVES:
- Provide a unified system for all resort operations
- Enable staff to manage bookings, guests, rooms, and finances
- Offer guests a modern booking experience
- Maintain complete audit trails for compliance
- Support future expansion to other properties

KEY FEATURES IMPLEMENTED (Phase 2):
- User authentication with JWT tokens
- Role-based access control (8 different roles)
- Comprehensive audit logging system
- Property management
- User management with password security
- Soft delete functionality (data never lost)
- Input validation and sanitization
- API documentation with Swagger

ARCHITECTURAL APPROACH:
- Modular Monolith (easier to deploy and maintain)
- Strict MVC pattern (Model-View-Controller)
- Domain-Driven Design principles
- API-first development
- Docker containerization

================================================================================
                         2. SYSTEM ARCHITECTURE
================================================================================

HIGH-LEVEL ARCHITECTURE:

Internet Users (Guests, Staff)
    |
    v
Cloudflare CDN (DDoS Protection, SSL, Caching)
    |
    v
Caddy Reverse Proxy (Routing, Load Balancing)
    |
    +-------------------+-------------------+
    |                   |                   |
    v                   v                   v
Next.js Website    React Admin Panel    NestJS Core API
(Guest Portal)     (Staff Operations)   (Business Logic)
                                            |
                        +-------------------+-------------------+
                        |                   |                   |
                        v                   v                   v
                  PostgreSQL           Redis Cache         Keycloak
                  (Database)          (Sessions)           (SSO/Auth)


SERVICE BREAKDOWN:

1. FRONTEND SERVICES:
   - Guest Website (Next.js)
     URL: https://blueberryhillsmunnar.in
     Port: 3000
     Purpose: Customer-facing booking site
   
   - Admin Panel (React + Vite)
     URL: https://hms.blueberryhillsmunnar.in
     Port: 5173
     Purpose: Staff operations dashboard
   
   - POS System (React)
     URL: https://pos.blueberryhillsmunnar.in
     Port: 5174
     Purpose: Restaurant and bar management
   
   - Digital Signage (React)
     URL: https://signage.blueberryhillsmunnar.in
     Purpose: Lobby displays, in-room information

2. BACKEND SERVICES:
   - Core API (NestJS)
     URL: https://api.blueberryhillsmunnar.in
     Port: 4000
     Purpose: All business logic and data operations
   
   - Content Management (Strapi)
     URL: https://cms.blueberryhillsmunnar.in
     Port: 1337
     Purpose: Website content, blogs, media

3. INFRASTRUCTURE SERVICES:
   - PostgreSQL Database
     Port: 5432
     Purpose: Primary data storage
     Version: 16 Alpine
   
   - Redis Cache
     Port: 6379
     Purpose: Session storage, caching, pub/sub
     Version: 7 Alpine
   
   - Keycloak
     Port: 8080
     Purpose: SSO authentication, identity management
     Version: 23.0
   
   - PgAdmin
     Port: 5050
     Purpose: Database administration UI

4. PROXY & SECURITY:
   - Caddy Web Server
     Ports: 80, 443
     Purpose: Reverse proxy, automatic HTTPS

NETWORK ARCHITECTURE:

All services run within a Docker bridge network called "blueberry_network"
This ensures:
- Services can communicate by container name
- Database is not exposed to internet
- Only Caddy exposes ports 80/443 externally

DATA FLOW EXAMPLE (Guest makes a booking):

1. Guest opens blueberryhillsmunnar.in
2. Request hits Cloudflare CDN
3. Cloudflare forwards to Caddy proxy
4. Caddy routes to Next.js website container
5. Website fetches room availability from NestJS API
6. API queries PostgreSQL database
7. API checks Redis cache first
8. Response flows back through the chain
9. Guest sees available rooms

================================================================================
                         3. TECHNOLOGY STACK
================================================================================

BACKEND TECHNOLOGIES:

Primary Framework: NestJS 10.x
- TypeScript-based Node.js framework
- Built-in dependency injection
- Modular architecture support
- Excellent TypeORM integration

Database: PostgreSQL 16
- Relational database for ACID compliance
- Supports JSONB for flexible data
- Robust transaction support
- Excellent performance for hotel operations

ORM: TypeORM 0.3.x
- Entity-based database modeling
- Automatic schema synchronization (dev mode)
- Migration support for production
- Support for soft deletes

Caching: Redis 7
- In-memory data store
- Pub/Sub for real-time features
- Session storage
- Rate limiting support

Authentication: JWT + Keycloak
- JWT: JSON Web Tokens for stateless auth
- Keycloak: Enterprise SSO solution
- Support for social login (future)
- Multi-factor authentication ready

Password Security: Bcrypt
- Industry-standard hashing algorithm
- 10 salt rounds for security
- Protection against rainbow table attacks

FRONTEND TECHNOLOGIES:

Guest Website: Next.js 14
- React-based framework
- Server-side rendering (SSR)
- Incremental static regeneration (ISR)
- Excellent SEO performance
- Image optimization built-in

Admin Panel: React 18 + Vite
- Single-page application (SPA)
- Fast hot module replacement
- Component-based architecture
- Vite for lightning-fast builds

State Management:
- React Query for server state
- Context API for global state
- Local state with hooks

INFRASTRUCTURE:

Containerization: Docker
- Consistent environments
- Easy deployment
- Version control for infrastructure
- Isolated services

Orchestration: Docker Compose
- Multi-container coordination
- Service dependencies management
- Environment variable injection
- Volume management

Reverse Proxy: Caddy 2.x
- Automatic HTTPS via Let's Encrypt
- Simple configuration
- Built-in security features
- Load balancing support

DEVELOPMENT TOOLS:

Package Manager: pnpm 8.x
- Faster than npm/yarn
- Disk space efficient
- Strict dependency management
- Workspace support

Monorepo: Turborepo
- Unified codebase management
- Shared dependencies
- Build caching
- Parallel task execution

Version Control: Git
- GitHub repository
- Feature branch workflow
- Conventional commits

Code Quality:
- ESLint for linting
- Prettier for formatting
- Husky for git hooks
- TypeScript for type safety

API Documentation: Swagger/OpenAPI 3.0
- Auto-generated from code
- Interactive testing UI
- Schema definitions
- Export to Postman/Insomnia

================================================================================
                      4. INSTALLATION & SETUP
================================================================================

PREREQUISITES:

Software Requirements:
- Docker version 24.x or higher
- Docker Compose version 2.x or higher
- Node.js version 18.x LTS or higher
- pnpm version 8.x or higher
- Git version 2.x or higher

Hardware Requirements (Minimum):
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD
- Network: 100Mbps

Hardware Requirements (Recommended):
- CPU: 8 cores
- RAM: 16GB
- Disk: 200GB SSD
- Network: 1Gbps

INSTALLATION STEPS:

Step 1: Clone Repository
Command: git clone https://github.com/mattel-group/blueberry-hms.git
Command: cd blueberry-hms

Step 2: Environment Setup
Command: cp .env.example .env
Then edit .env file with your preferred text editor
IMPORTANT: Change DB_PASSWORD and JWT_SECRET before starting

Step 3: Install pnpm (if not installed)
Command: npm install -g pnpm

Step 4: Install Dependencies
Command: pnpm install
This installs all Node.js packages for the entire monorepo

Step 5: Start Docker Infrastructure
Command: docker-compose up -d
This starts PostgreSQL, Redis, Keycloak, and other services
Wait 30 seconds for all services to initialize

Step 6: Verify Infrastructure
Command: docker-compose ps
Expected: All containers should show "Up" or "Up (healthy)"

Step 7: Start Development API
Command: cd apps/api-core
Command: pnpm run start:dev
Expected: API starts on http://localhost:4000

Step 8: Verify API
Open browser: http://localhost:4000/api/v1/health
Expected: JSON response with status "ok"

Step 9: Access API Documentation
Open browser: http://localhost:4000/api/docs
Expected: Swagger UI with all API endpoints

Step 10: Create First User
Use Swagger UI or curl:
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blueberryhillsmunnar.in",
    "password": "Admin@Blueberry2026",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "SUPER_ADMIN"
  }'

VERIFICATION CHECKLIST:

[ ] Docker containers all running
[ ] PostgreSQL accessible on port 5432
[ ] Redis accessible on port 6379
[ ] Keycloak accessible on port 8080
[ ] API responds at http://localhost:4000/api/v1/health
[ ] Swagger docs load at http://localhost:4000/api/docs
[ ] Can register a new user
[ ] Can login and receive JWT token
[ ] PgAdmin accessible on port 5050

================================================================================
                     5. ENVIRONMENT CONFIGURATION
================================================================================

ENVIRONMENT VARIABLES (.env file):

PROJECT DETAILS:
PROJECT_NAME=Blueberry HMS
PROPERTY_NAME=Blueberry Hills Resort
PROPERTY_DOMAIN=blueberryhillsmunnar.in
NODE_ENV=development

DATABASE CONFIGURATION:
DB_HOST=localhost
  (Use "localhost" when API runs outside Docker)
  (Use "postgres" when API runs inside Docker)
DB_PORT=5432
DB_USER=blueberry_admin
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DB_NAME=blueberry_hms

API CONFIGURATION:
API_PORT=4000
API_URL=http://localhost:4000

JWT CONFIGURATION:
JWT_SECRET=YOUR_32_CHARACTER_SECRET_KEY_HERE
JWT_EXPIRATION=7d
  (Token expires after 7 days)

KEYCLOAK CONFIGURATION:
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=blueberry
KEYCLOAK_CLIENT_ID=hms-backend
KEYCLOAK_CLIENT_SECRET=your-keycloak-secret

STRAPI CMS CONFIGURATION:
STRAPI_PORT=1337
STRAPI_URL=http://localhost:1337
STRAPI_ADMIN_EMAIL=admin@blueberryhillsmunnar.in
STRAPI_ADMIN_PASSWORD=YOUR_CMS_PASSWORD_HERE

FRONTEND PORTS:
GUEST_WEB_PORT=3000
ADMIN_PANEL_PORT=5173
POS_PORT=5174

REDIS CONFIGURATION:
REDIS_HOST=localhost
REDIS_PORT=6379

FILE UPLOAD CONFIGURATION:
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
  (10MB in bytes)

CLOUDFLARE (Production Only):
CF_TUNNEL_TOKEN=your_cloudflare_tunnel_token
CF_ZONE_ID=your_cloudflare_zone_id

SECURITY NOTES:

1. JWT_SECRET Generation:
   Use this command to generate a secure secret:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

2. Database Password:
   Minimum 16 characters
   Include uppercase, lowercase, numbers, symbols
   Never use default passwords in production

3. Never Commit .env File:
   The .env file is in .gitignore
   Always use .env.example as template
   Share secrets securely (not via email/chat)

================================================================================
                        6. DATABASE SCHEMA
================================================================================

CURRENT SCHEMA (Phase 2 Complete):

DATABASE NAME: blueberry_hms

TABLE 1: properties
Purpose: Store resort/hotel configuration and settings

Columns:
- id (UUID, Primary Key)
- name (VARCHAR 200) - Property name
- tagline (VARCHAR 500) - Marketing tagline
- domain_url (VARCHAR 100) - Website domain
- logo_path (VARCHAR) - Path to logo file
- address (TEXT) - Full address
- city (VARCHAR 100)
- state (VARCHAR 100)
- pincode (VARCHAR 20)
- country (VARCHAR 100)
- phone (VARCHAR 20)
- email (VARCHAR 100)
- settings (JSONB) - Flexible configuration storage
- is_active (BOOLEAN, default TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP) - For soft delete

Indexes:
- Primary key on id

TABLE 2: users
Purpose: Store staff and system user accounts

Columns:
- id (UUID, Primary Key)
- keycloak_id (VARCHAR 255) - External SSO identifier
- email (VARCHAR 100, UNIQUE) - Login email
- password (VARCHAR 255) - Bcrypt hashed password
- first_name (VARCHAR 100)
- last_name (VARCHAR 100)
- phone_number (VARCHAR 20)
- role (ENUM users_role_enum) - User role
- status (ENUM users_status_enum) - Account status
- profile_picture (VARCHAR 500) - Avatar path
- preferences (JSONB) - User preferences
- last_login_at (TIMESTAMP)
- last_login_ip (VARCHAR 45)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP)

Indexes:
- Primary key on id
- Unique index on email

ENUM: users_role_enum
Values:
- SUPER_ADMIN (IT/Mattel Group - full system access)
- OWNER (Resort Manager - operational control)
- MANAGER (Department managers)
- FRONT_DESK (Reception staff)
- HOUSEKEEPING (Cleaning staff)
- KITCHEN (Restaurant/bar staff)
- MAINTENANCE (Technical staff)
- GUEST (Portal users - limited access)

ENUM: users_status_enum
Values:
- ACTIVE (Can login and use system)
- INACTIVE (Temporarily disabled)
- SUSPENDED (Blocked due to security)
- PENDING_VERIFICATION (Awaiting email confirmation)

TABLE 3: audit_logs
Purpose: Track all system changes for compliance

Columns:
- id (UUID, Primary Key)
- user_id (VARCHAR) - Who made the change
- action (VARCHAR 50) - CREATE, UPDATE, DELETE
- entity (VARCHAR 100) - Which table/resource
- entity_id (VARCHAR) - Specific record ID
- ip_address (VARCHAR 45) - Request IP
- user_agent (TEXT) - Browser/client info
- before (JSONB) - State before change
- after (JSONB) - State after change
- metadata (JSONB) - Additional context
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP)

Indexes:
- Primary key on id
- Composite index on (user_id, created_at)
- Composite index on (action, created_at)

SOFT DELETE IMPLEMENTATION:

All tables include deleted_at column
When a record is "deleted":
1. deleted_at is set to current timestamp
2. Record remains in database
3. Queries automatically exclude deleted records
4. Can be restored by setting deleted_at to NULL

Benefits:
- Data recovery possible
- Audit trail maintained
- Referential integrity preserved
- Compliance with data retention laws

DATABASE BACKUP STRATEGY:

Development:
- Manual backups before major changes
- Command: docker exec blueberry_postgres pg_dump -U blueberry_admin blueberry_hms > backup.sql

Production:
- Automated daily backups at 2 AM
- Retain backups for 30 days
- Weekly full backups retained for 1 year
- Backups stored on separate server
- Test restore monthly

UPCOMING SCHEMA (Phase 3 - Room Management):

TABLE: amenities
- id, name, description, icon, is_premium, display_order, is_active
- timestamps, soft delete

TABLE: room_types
- id, name, tagline, description, base_price, max_occupancy
- size_sqft, bed_type, view_type, has_balcony, has_kitchen
- display_order, is_active, timestamps, soft delete

TABLE: rooms
- id, room_number, floor_number, status, room_type_id
- custom_rate, notes, last_cleaned_at, last_inspected_at
- is_active, timestamps, soft delete

TABLE: room_type_amenities (Junction table)
- room_type_id, amenity_id

================================================================================
                          7. API ENDPOINTS
================================================================================

BASE URL: http://localhost:4000/api/v1
API DOCUMENTATION: http://localhost:4000/api/docs

AUTHENTICATION ENDPOINTS (/auth):

POST /auth/register
Purpose: Create new user account
Authentication: Not required
Request Body:
  {
    "email": "user@blueberryhillsmunnar.in",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "FRONT_DESK"
  }
Response (201):
  {
    "access_token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@blueberryhillsmunnar.in",
      "firstName": "John",
      "lastName": "Doe",
      "role": "FRONT_DESK"
    }
  }

POST /auth/login
Purpose: Authenticate and get JWT token
Authentication: Not required
Request Body:
  {
    "email": "admin@blueberryhillsmunnar.in",
    "password": "Admin@Blueberry2026"
  }
Response (200):
  {
    "access_token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@blueberryhillsmunnar.in",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "SUPER_ADMIN"
    }
  }

GET /auth/me
Purpose: Get current user profile
Authentication: Required (JWT token in Authorization header)
Headers: Authorization: Bearer <access_token>
Response (200):
  {
    "id": "uuid",
    "email": "admin@blueberryhillsmunnar.in",
    "firstName": "System",
    "lastName": "Administrator",
    "fullName": "System Administrator",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "phoneNumber": null,
    "profilePicture": null,
    "lastLoginAt": "2026-03-05T10:30:00.000Z"
  }

USER MANAGEMENT ENDPOINTS (/users):

GET /users
Purpose: List all users
Authentication: Required
Query Parameters:
  - role (optional): Filter by role (e.g., ?role=FRONT_DESK)
Response (200):
  [
    {
      "id": "uuid",
      "email": "staff@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "FRONT_DESK",
      "status": "ACTIVE",
      "createdAt": "2026-03-05T10:00:00.000Z"
    }
  ]
Note: Password field is never included in responses

GET /users/:id
Purpose: Get specific user by ID
Authentication: Required
Response (200):
  {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "role": "FRONT_DESK",
    "status": "ACTIVE",
    "phoneNumber": "+91-1234567890",
    "createdAt": "2026-03-05T10:00:00.000Z"
  }

PATCH /users/:id
Purpose: Update user information
Authentication: Required
Request Body (all fields optional):
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "+91-9876543210",
    "status": "INACTIVE"
  }
Response (200):
  Updated user object

DELETE /users/:id
Purpose: Soft delete user
Authentication: Required
Response (204): No content
Note: User is not permanently deleted, just marked as deleted

PROPERTY MANAGEMENT ENDPOINTS (/property):

GET /property
Purpose: List all properties
Authentication: Not required
Response (200):
  [
    {
      "id": "uuid",
      "name": "Blueberry Hills Resort",
      "tagline": "Experience Tranquility in Munnar",
      "domainUrl": "blueberryhillsmunnar.in",
      "city": "Munnar",
      "state": "Kerala",
      "country": "India",
      "isActive": true
    }
  ]

GET /property/active
Purpose: Get the currently active property
Authentication: Not required
Response (200):
  Single property object

GET /property/:id
Purpose: Get specific property
Authentication: Not required
Response (200):
  Property object with all fields

POST /property
Purpose: Create new property
Authentication: Required
Request Body:
  {
    "name": "Blueberry Hills Resort",
    "tagline": "Experience Tranquility",
    "domainUrl": "blueberryhillsmunnar.in",
    "address": "Munnar Hills",
    "city": "Munnar",
    "state": "Kerala",
    "pincode": "685612",
    "country": "India",
    "phone": "+91-4865-230567",
    "email": "info@blueberryhillsmunnar.in"
  }
Response (201):
  Created property object

PATCH /property/:id
Purpose: Update property information
Authentication: Required
Request Body: Partial property object
Response (200): Updated property object

DELETE /property/:id
Purpose: Soft delete property
Authentication: Required
Response (204): No content

HEALTH CHECK ENDPOINT:

GET /health
Purpose: Check if API is running
Authentication: Not required
Response (200):
  {
    "status": "ok",
    "timestamp": "2026-03-05T10:30:00.000Z",
    "service": "Blueberry HMS API",
    "property": "Blueberry Hills Resort, Munnar",
    "version": "1.0.0"
  }

ERROR RESPONSES:

All errors follow standard format:
{
  "statusCode": 401,
  "timestamp": "2026-03-05T10:30:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": "Invalid credentials"
}

HTTP STATUS CODES:
200 - Success
201 - Created
204 - No Content (successful deletion)
400 - Bad Request (validation error)
401 - Unauthorized (invalid/missing token)
403 - Forbidden (insufficient permissions)
404 - Not Found
409 - Conflict (duplicate email, etc.)
500 - Internal Server Error

================================================================================
                       8. SECURITY IMPLEMENTATION
================================================================================

AUTHENTICATION SECURITY:

Password Hashing:
- Algorithm: Bcrypt
- Salt Rounds: 10
- Password never stored in plaintext
- Password never exposed in API responses
- Password excluded from audit logs

Example password hash:
$2b$10$uKSVFGM6XA8bTTtxdfRWIuFG.LIAJNv9QcYwem/RLq7ozc.jFOL/2

JWT Token Security:
- Algorithm: HS256 (HMAC with SHA-256)
- Token expiration: 7 days
- Secret key minimum 32 characters
- Tokens signed and verified on every request
- No sensitive data in token payload

Token Structure:
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "FRONT_DESK",
  "iat": 1772682671,
  "exp": 1773287471
}

AUTHORIZATION:

Role Hierarchy:
1. SUPER_ADMIN (Level 100) - Full system access
2. OWNER (Level 90) - Operational control
3. MANAGER (Level 70) - Department management
4. FRONT_DESK (Level 50) - Guest operations
5. HOUSEKEEPING (Level 30) - Cleaning operations
6. KITCHEN (Level 30) - F&B operations
7. MAINTENANCE (Level 30) - Technical operations
8. GUEST (Level 10) - Limited portal access

Permission System:
- Users can access features at or below their level
- SUPER_ADMIN can manage all users
- OWNER can manage staff (not admins)
- MANAGER can view reports, manage inventory
- Staff can only access their work areas

INPUT VALIDATION:

DTO Validation:
- All inputs validated using class-validator
- Unknown fields automatically stripped (whitelist mode)
- Type checking enforced
- Format validation (email, phone, etc.)
- Length constraints enforced

Example:
Input: { "email": "invalid", "password": "123" }
Error: {
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 8 characters"
  ]
}

SQL Injection Prevention:
- TypeORM parameterized queries
- No raw SQL with user input
- Input sanitization via DTOs

XSS Prevention:
- Helmet.js security headers
- Content Security Policy
- No eval() or innerHTML usage

AUDIT LOGGING:

What is Logged:
- All CREATE, UPDATE, DELETE operations
- User ID performing action
- IP address of request
- User agent (browser/client)
- Timestamp of action
- Entity affected (table name)
- Entity ID (specific record)
- Before state (for updates/deletes)
- After state (for creates/updates)
- Additional metadata (URL, parameters)

What is NOT Logged:
- Passwords
- JWT tokens
- Credit card data (future)
- Personal identification documents

Audit Log Retention:
- Development: 90 days
- Production: 7 years (compliance)

Example Audit Log Entry:
{
  "id": "uuid",
  "userId": "admin-uuid",
  "action": "UPDATE",
  "entity": "users",
  "entityId": "user-uuid",
  "ipAddress": "::1",
  "userAgent": "curl/8.5.0",
  "before": {
    "status": "ACTIVE"
  },
  "after": {
    "status": "INACTIVE"
  },
  "metadata": {
    "url": "/api/v1/users/uuid",
    "method": "PATCH"
  },
  "createdAt": "2026-03-05T10:30:00.000Z"
}

NETWORK SECURITY:

CORS Configuration:
- Development: Allow all origins (*)
- Production: Whitelist specific domains
  - https://blueberryhillsmunnar.in
  - https://hms.blueberryhillsmunnar.in

SSL/TLS:
- All production traffic over HTTPS
- Automatic certificate via Let's Encrypt
- TLS 1.2 minimum
- Strong cipher suites only

HTTP Security Headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Content-Security-Policy

DATABASE SECURITY:

Connection Security:
- Database not exposed to internet
- Only accessible via Docker network
- Strong password required
- Connection pooling with limits

Data Encryption:
- Passwords: Bcrypt hashed
- Database: Encryption at rest (future)
- Backups: Encrypted with GPG

Soft Delete:
- No permanent data deletion
- Maintains referential integrity
- Supports data recovery
- Audit trail preserved

ACCESS CONTROL:

Database Access:
- Application user: Limited permissions
- Admin user: Full database access
- No root/superuser in application

API Access:
- Public endpoints: Limited
- Authenticated endpoints: JWT required
- Admin endpoints: Role check required

Rate Limiting (Future):
- Login attempts: 5 per 15 minutes
- API requests: 100 per minute per user
- Registration: 3 per hour per IP

SECURITY CHECKLIST FOR PRODUCTION:

[ ] Change all default passwords
[ ] Generate strong JWT_SECRET (32+ chars)
[ ] Enable HTTPS via Cloudflare
[ ] Configure firewall (UFW/iptables)
[ ] Enable Docker secrets
[ ] Set up automated backups
[ ] Configure rate limiting
[ ] Enable audit log alerts
[ ] Review user permissions
[ ] Test disaster recovery
[ ] Enable 2FA for admins
[ ] Set up intrusion detection
[ ] Configure log monitoring
[ ] Enable automatic security updates

================================================================================
                   9. PHASE IMPLEMENTATION STATUS
================================================================================

PHASE 1: INFRASTRUCTURE SETUP
Status: COMPLETE (100%)
Completed: March 3, 2026

Deliverables:
[X] Docker and Docker Compose setup
[X] PostgreSQL 16 database
[X] Redis 7 cache server
[X] Keycloak 23 authentication server
[X] PgAdmin database management UI
[X] Caddy reverse proxy configuration
[X] Environment variable management
[X] Monorepo structure with Turborepo
[X] pnpm workspace configuration
[X] Git repository initialization
[X] Project folder structure

Infrastructure Services:
- PostgreSQL: Running on port 5432
- Redis: Running on port 6379
- Keycloak: Running on port 8080
- PgAdmin: Running on port 5050
- All services healthy and communicating

Files Created:
- docker-compose.yml
- .env.example
- .env
- .gitignore
- pnpm-workspace.yaml
- turbo.json
- package.json (root)

PHASE 2: CORE SECURITY & USER MANAGEMENT
Status: COMPLETE (100%)
Completed: March 5, 2026

Phase 2A: Foundation (COMPLETE)
[X] BaseEntity abstract class
  - UUID primary key
  - created_at, updated_at timestamps
  - deleted_at for soft delete
  
[X] Global Exception Filter
  - Standardized error responses
  - Error logging
  - Stack trace in development
  
[X] Audit Logging System
  - Audit log entity
  - Audit interceptor
  - Automatic logging of all changes
  - IP and user agent tracking
  
[X] Input Validation
  - Global validation pipe
  - DTO-based validation
  - Whitelist mode (strip unknown fields)

Phase 2B: User Management (COMPLETE)
[X] User entity with all fields
[X] User role enumeration (8 roles)
[X] User status enumeration (4 statuses)
[X] User DTOs (create, update)
[X] User service with business logic
[X] User controller with CRUD endpoints
[X] User module registration
[X] Email uniqueness validation
[X] Soft delete functionality

Phase 2C: Authentication (COMPLETE)
[X] JWT strategy implementation
[X] Bcrypt password hashing (10 rounds)
[X] Auth service (register, login)
[X] Auth controller endpoints
[X] Auth module registration
[X] JWT authentication guard
[X] Current user decorator
[X] Password exclusion from responses
[X] Login/Register endpoints tested
[X] Protected route verification

Database Changes (Phase 2):
- Created properties table
- Created users table with enums
- Created audit_logs table
- Added indexes for performance
- All tables support soft delete

API Endpoints Created:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- GET /api/v1/users
- GET /api/v1/users?role=ROLE_NAME
- GET /api/v1/users/:id
- PATCH /api/v1/users/:id
- DELETE /api/v1/users/:id
- GET /api/v1/property
- GET /api/v1/property/active
- GET /api/v1/property/:id
- POST /api/v1/property
- PATCH /api/v1/property/:id
- DELETE /api/v1/property/:id
- GET /api/v1/health

Testing Completed:
[X] User registration with password
[X] User login with JWT token
[X] Protected endpoint access
[X] Invalid credentials rejection
[X] Password excluded from responses
[X] Audit logging verification
[X] Soft delete functionality
[X] Email uniqueness enforcement

PHASE 3: ROOM MANAGEMENT
Status: READY TO START (0%)
Target Start: March 5, 2026

Planned Deliverables:
[ ] Room status enumeration
[ ] Bed type enumeration
[ ] View type enumeration
[ ] Amenity entity
[ ] Room type entity
[ ] Room entity
[ ] Amenity DTOs
[ ] Room type DTOs
[ ] Room DTOs
[ ] Amenity service
[ ] Room type service
[ ] Room service
[ ] Amenity controller
[ ] Room type controller
[ ] Room controller
[ ] Image upload handling
[ ] Room availability calculator
[ ] Pricing engine foundation

Database Schema (Planned):
- amenities table
- room_types table
- rooms table
- room_type_amenities junction table

API Endpoints (Planned):
- /api/v1/amenities (CRUD)
- /api/v1/room-types (CRUD)
- /api/v1/rooms (CRUD)
- /api/v1/rooms/available (availability check)
- /api/v1/room-types/:id/images (image upload)

PHASE 4: BOOKING ENGINE
Status: PLANNED
Target Start: After Phase 3

Planned Features:
- Booking entity
- Guest entity
- Availability algorithm
- Double-booking prevention
- Pricing calculator
- Booking state machine
- Payment integration foundation

PHASE 5: FRONT DESK OPERATIONS
Status: PLANNED
Target Start: After Phase 4

Planned Features:
- Check-in workflow
- Check-out workflow
- Guest profile management
- Tape chart visualization
- Room assignment
- Key card generation
- Real-time notifications

PHASE 6: POS & RESTAURANT
Status: PLANNED
Target Start: After Phase 5

Planned Features:
- Menu management
- Table management
- Order processing
- Kitchen Order Tickets (KOT)
- Room posting
- Bill splitting
- Payment processing

PHASE 7: WEBSITE & CMS
Status: PLANNED
Target Start: After Phase 6

Planned Features:
- Strapi CMS setup
- Next.js website
- Room showcase pages
- Online booking widget
- Content management
- Blog system
- SEO optimization

PHASE 8: HOUSEKEEPING & MAINTENANCE
Status: PLANNED
Target Start: After Phase 7

Planned Features:
- Room cleaning workflow
- Inspection system
- Maintenance tickets
- Task assignment
- Staff scheduling
- Inventory tracking

PHASE 9: FINANCE & REPORTING
Status: PLANNED
Target Start: After Phase 8

Planned Features:
- Revenue reports
- Occupancy reports
- ADR/RevPAR calculations
- Expense tracking
- Invoice generation
- Tax reporting
- Financial dashboard

PHASE 10: HARDWARE INTEGRATION
Status: PLANNED
Target Start: After Phase 9

Planned Features:
- WiFi captive portal (FreeRADIUS)
- Digital signage system
- PMS integration
- Door lock integration
- Payment terminal integration
- Telephone system integration

OVERALL PROJECT PROGRESS:
Phases Completed: 2 of 10 (20%)
Core Foundation: 100% Complete
Infrastructure: 100% Complete
Security: 100% Complete
Authentication: 100% Complete
User Management: 100% Complete
Room Management: 0% Complete

Current System Capabilities:
- User registration and authentication
- Role-based access control
- Property management
- Comprehensive audit logging
- API documentation
- Database backups
- Docker deployment

================================================================================
                        10. FILE STRUCTURE
================================================================================

PROJECT ROOT: /blueberry-hms/

Directory Structure:

blueberry-hms/
├── .env                          Environment variables (gitignored)
├── .env.example                  Environment template
├── .gitignore                    Git ignore rules
├── docker-compose.yml            Docker services configuration
├── pnpm-workspace.yaml           pnpm workspace config
├── turbo.json                    Turborepo configuration
├── package.json                  Root package file
├── README.md                     Project documentation
├── PROJECT_DOCUMENTATION.txt     This file
├──
├── apps/                         Application modules
│   ├── api-core/                 NestJS Backend API
│   │   ├── src/
│   │   │   ├── common/          Shared utilities
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   └── roles.decorator.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── base.entity.ts
│   │   │   │   ├── enums/
│   │   │   │   │   ├── user-role.enum.ts
│   │   │   │   │   ├── user-status.enum.ts
│   │   │   │   │   ├── room-status.enum.ts (Phase 3)
│   │   │   │   │   ├── bed-type.enum.ts (Phase 3)
│   │   │   │   │   └── view-type.enum.ts (Phase 3)
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   └── interceptors/
│   │   │   │       └── audit-log.interceptor.ts
│   │   │   ├── config/
│   │   │   │   └── database.config.ts
│   │   │   ├── modules/
│   │   │   │   ├── audit/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── audit-log.entity.ts
│   │   │   │   │   └── audit.module.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   │   └── register.dto.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.module.ts
│   │   │   │   ├── property/
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── create-property.dto.ts
│   │   │   │   │   │   └── update-property.dto.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── property.entity.ts
│   │   │   │   │   ├── property.controller.ts
│   │   │   │   │   ├── property.service.ts
│   │   │   │   │   └── property.module.ts
│   │   │   │   ├── user/
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   │   └── update-user.dto.ts
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── user.entity.ts
│   │   │   │   │   ├── user.controller.ts
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   └── user.module.ts
│   │   │   │   ├── amenity/ (Phase 3)
│   │   │   │   ├── room-type/ (Phase 3)
│   │   │   │   └── room/ (Phase 3)
│   │   │   ├── app.controller.ts
│   │   │   ├── app.service.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── guest-web/                Next.js Website (Future)
│   ├── admin-panel/              React Admin (Future)
│   ├── pos-system/               POS System (Future)
│   └── signage/                  Digital Signage (Future)
│
├── services/                     Infrastructure services
│   ├── cms/                      Strapi CMS (Future)
│   └── database/
│       └── init/                 Database initialization scripts
│
├── uploads/                      File storage (gitignored)
│   ├── property/                 Resort logos, branding
│   ├── rooms/                    Room images (Phase 3)
│   │   └── {room-type-id}/
│   ├── guests/                   Guest documents (Phase 4)
│   └── invoices/                 Generated PDFs (Phase 9)
│
└── logs/                         Application logs (gitignored)
    ├── api.log
    ├── error.log
    └── audit.log

Key Files Explained:

.env
Purpose: Environment variables for configuration
Security: Never commit to git, contains secrets
Usage: Loaded by NestJS ConfigModule

docker-compose.yml
Purpose: Define all Docker services
Services: postgres, redis, keycloak, pgadmin, api-core (future)
Network: Creates blueberry_network bridge

pnpm-workspace.yaml
Purpose: Define monorepo workspaces
Workspaces: apps/*, services/*
Benefits: Shared dependencies, linked packages

turbo.json
Purpose: Configure build pipeline
Features: Caching, parallel execution
Tasks: dev, build, test, lint

base.entity.ts
Purpose: Abstract base class for all entities
Features: UUID, timestamps, soft delete
Inheritance: All entities extend this

http-exception.filter.ts
Purpose: Global error handler
Features: Standardized error format, logging
Applied: Globally in main.ts

audit-log.interceptor.ts
Purpose: Automatic audit logging
Triggers: POST, PUT, PATCH, DELETE requests
Data: User, IP, before/after states

jwt-auth.guard.ts
Purpose: Protect routes requiring authentication
Usage: @UseGuards(JwtAuthGuard)
Validates: JWT token in Authorization header

roles.guard.ts
Purpose: Enforce role-based access
Usage: @Roles('SUPER_ADMIN', 'OWNER')
Checks: User role hierarchy

database.config.ts
Purpose: TypeORM configuration
Features: Auto-entity discovery, synchronization
Environment: Uses .env variables

*.entity.ts files
Purpose: Database table definitions
Pattern: TypeORM decorators
Features: Relations, indexes, constraints

*.dto.ts files
Purpose: Data Transfer Objects
Pattern: class-validator decorators
Security: Input validation and sanitization

*.service.ts files
Purpose: Business logic layer
Pattern: Injectable services
Responsibilities: Database operations, calculations

*.controller.ts files
Purpose: HTTP route handlers
Pattern: RESTful endpoints
Decorators: @Get(), @Post(), @Patch(), @Delete()

*.module.ts files
Purpose: Group related features
Pattern: NestJS modules
Imports: Dependencies and providers

main.ts
Purpose: Application bootstrap
Configuration: CORS, validation, Swagger
Port: 4000 (configurable via .env)

Naming Conventions:
- Files: kebab-case.ts
- Classes: PascalCase
- Methods: camelCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: IPascalCase

File Size Guidelines:
- Entity files: < 200 lines
- Service files: < 500 lines
- Controller files: < 300 lines
- DTO files: < 100 lines

Code Organization:
- One class per file
- Related files in same directory
- Group by feature, not by type
- Keep related code together

================================================================================
                    11. USER ROLES & PERMISSIONS
================================================================================

ROLE HIERARCHY (By Access Level):

1. SUPER_ADMIN (Level 100)
   Description: IT staff, Mattel Group technical team
   Access: Complete system access
   
   Permissions:
   - Create/Edit/Delete all users (including other admins)
   - Configure system settings
   - Access all modules
   - View all audit logs
   - Manage database
   - Configure integrations
   - Access PgAdmin
   - System maintenance
   - Backup/Restore operations
   
   Restrictions:
   - None
   
   Use Cases:
   - System setup and configuration
   - Technical troubleshooting
   - Database management
   - Security incident response
   - Software updates

2. OWNER (Level 90)
   Description: Resort Manager, General Manager
   Access: Full operational control
   
   Permissions:
   - Create/Edit staff users (not admins)
   - View all bookings and finances
   - Access all operational modules
   - Generate reports
   - Manage room rates
   - Override pricing
   - Approve refunds
   - View audit logs (limited)
   - Configure property settings
   
   Restrictions:
   - Cannot create SUPER_ADMIN users
   - Cannot access system configuration
   - Cannot access database directly
   
   Use Cases:
   - Daily operations management
   - Staff management
   - Financial oversight
   - Strategic decisions
   - Performance monitoring

3. MANAGER (Level 70)
   Description: Department managers (F&B, Housekeeping, Front Office)
   Access: Department-specific operations
   
   Permissions:
   - View department reports
   - Manage department staff schedules
   - View bookings related to department
   - Process department-specific tasks
   - Generate department reports
   - Manage department inventory
   
   Restrictions:
   - Cannot create users
   - Cannot access financial data
   - Limited to assigned department
   - Cannot override pricing
   
   Use Cases:
   - Department supervision
   - Task assignment
   - Inventory management
   - Staff scheduling
   - Quality control

4. FRONT_DESK (Level 50)
   Description: Reception staff, front office agents
   Access: Guest operations
   
   Permissions:
   - Create/Edit bookings
   - Check-in/Check-out guests
   - Process payments
   - Create guest profiles
   - Assign rooms
   - View room availability
   - Generate invoices
   - Handle guest requests
   - View current occupancy
   
   Restrictions:
   - Cannot edit room rates
   - Cannot delete bookings
   - Cannot access staff management
   - Cannot view financial reports
   - Limited history access (30 days)
   
   Use Cases:
   - Guest arrivals and departures
   - Booking management
   - Guest inquiries
   - Payment processing
   - Room assignments

5. HOUSEKEEPING (Level 30)
   Description: Cleaning staff, room attendants
   Access: Room status and cleaning tasks
   
   Permissions:
   - View assigned rooms
   - Update room status
   - Mark rooms as cleaned
   - Report maintenance issues
   - View daily task list
   - Access cleaning checklist
   
   Restrictions:
   - Cannot view guest information
   - Cannot access bookings
   - Cannot view pricing
   - Limited to assigned floors/sections
   
   Use Cases:
   - Room cleaning
   - Status updates
   - Maintenance reporting
   - Task completion
   - Inventory requests

6. KITCHEN (Level 30)
   Description: Restaurant and bar staff
   Access: F&B operations
   
   Permissions:
   - View orders
   - Update order status
   - Manage menu items
   - Process KOTs
   - View table assignments
   - Post charges to rooms
   
   Restrictions:
   - Cannot view room details
   - Cannot access guest profiles
   - Limited to F&B module
   
   Use Cases:
   - Order processing
   - Menu management
   - Kitchen operations
   - Table service
   - Room service

7. MAINTENANCE (Level 30)
   Description: Technical and maintenance staff
   Access: Maintenance operations
   
   Permissions:
   - View maintenance tickets
   - Update ticket status
   - Report completed work
   - View room maintenance history
   - Request parts/supplies
   
   Restrictions:
   - Cannot view guest information
   - Cannot access financial data
   - Limited to maintenance module
   
   Use Cases:
   - Repair work
   - Preventive maintenance
   - Technical support
   - Equipment tracking

8. GUEST (Level 10)
   Description: Hotel guests, portal users
   Access: Personal booking information
   
   Permissions:
   - View own bookings
   - Modify own profile
   - Make new bookings
   - View invoices
   - Submit requests
   - Rate services
   
   Restrictions:
   - Cannot view other guests
   - Cannot access staff features
   - Limited to personal data
   
   Use Cases:
   - Online bookings
   - Profile management
   - Service requests
   - Feedback submission

PERMISSION MATRIX:

Feature                    | SUPER | OWNER | MANAGER | FRONT | HOUSE | KITCHEN | MAINT | GUEST
---------------------------|-------|-------|---------|-------|-------|---------|-------|------
User Management            |  ALL  |  YES  |   NO    |  NO   |  NO   |   NO    |  NO   |  NO
Property Settings          |  YES  |  YES  |   NO    |  NO   |  NO   |   NO    |  NO   |  NO
Room Management            |  YES  |  YES  |   NO    |  YES  |  YES  |   NO    | VIEW  |  NO
Booking Management         |  YES  |  YES  |  VIEW   |  YES  |  NO   |   NO    |  NO   | OWN
Guest Management           |  YES  |  YES  |   NO    |  YES  |  NO   |   NO    |  NO   | OWN
Payment Processing         |  YES  |  YES  |   NO    |  YES  |  NO   |   NO    |  NO   | OWN
Financial Reports          |  YES  |  YES  |   NO    |  NO   |  NO   |   NO    |  NO   |  NO
Housekeeping Tasks         |  YES  |  YES  |  YES    |  YES  |  YES  |   NO    |  NO   |  NO
F&B Operations             |  YES  |  YES  |  YES    |  YES  |  NO   |   YES   |  NO   |  NO
Maintenance Tickets        |  YES  |  YES  |  YES    |  YES  |  YES  |   NO    |  YES  |  NO
Audit Logs                 |  YES  |  YES  |   NO    |  NO   |  NO   |   NO    |  NO   |  NO
System Configuration       |  YES  |  NO   |   NO    |  NO   |  NO   |   NO    |  NO   |  NO

Legend:
ALL = Full CRUD access
YES = Full access to feature
VIEW = Read-only access
OWN = Access to own data only
NO = No access

ROLE ASSIGNMENT RULES:

1. Only SUPER_ADMIN can create SUPER_ADMIN users
2. OWNER can create MANAGER, FRONT_DESK, and staff users
3. Users cannot elevate their own permissions
4. Role changes are logged in audit system
5. Inactive users retain role but cannot login
6. Deleted users cannot be assigned to new records

USER STATUS TRANSITIONS:

PENDING_VERIFICATION --> ACTIVE (Email verified)
ACTIVE --> INACTIVE (Temporary disable)
ACTIVE --> SUSPENDED (Security issue)
INACTIVE --> ACTIVE (Reactivation)
SUSPENDED --> ACTIVE (Issue resolved)
Any status --> DELETED (Soft delete)

STATUS PERMISSIONS:

ACTIVE: Full access based on role
INACTIVE: Cannot login, data preserved
SUSPENDED: Cannot login, requires admin intervention
PENDING_VERIFICATION: Limited access (guest portal only)
DELETED: No access, audit trail preserved

SECURITY POLICIES:

Password Requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended
- Cannot contain email address
- Cannot be common password

Session Management:
- JWT tokens expire after 7 days
- Tokens invalidated on password change
- Logout clears token client-side
- Multiple sessions allowed (future: configurable)

Account Lockout (Future):
- 5 failed login attempts
- 15-minute lockout period
- SUPER_ADMIN immune to lockout
- Unlock via password reset or admin

Two-Factor Authentication (Future):
- Mandatory for SUPER_ADMIN
- Optional for OWNER and MANAGER
- SMS or authenticator app
- Backup codes provided

AUDIT TRAIL:

All Role-Related Actions Logged:
- User creation (who created whom)
- Role changes (from what to what)
- Permission grants/revocations
- Status changes
- Password changes
- Login attempts (success/failure)
- Account deletions

Audit Log Retention:
- Development: 90 days
- Production: 7 years

================================================================================
                      12. DEVELOPMENT WORKFLOW
================================================================================

GIT WORKFLOW:

Branch Strategy:
- main: Production-ready code
- develop: Integration branch
- feature/*: New features
- bugfix/*: Bug fixes
- hotfix/*: Urgent production fixes

Feature Development:
1. Create feature branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/room-management

2. Make changes and commit regularly
   git add .
   git commit -m "feat: add room entity"

3. Push to remote
   git push origin feature/room-management

4. Create Pull Request to develop
5. Code review and approval
6. Merge to develop
7. Delete feature branch

Commit Message Format:
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance tasks

Examples:
feat(auth): add JWT authentication
fix(user): resolve email validation issue
docs(api): update endpoint documentation
refactor(booking): simplify availability logic

DEVELOPMENT ENVIRONMENT SETUP:

1. Install Prerequisites:
   - Node.js 18.x LTS
   - pnpm 8.x
   - Docker Desktop
   - VS Code (recommended)

2. Clone Repository:
   git clone https://github.com/mattel-group/blueberry-hms.git
   cd blueberry-hms

3. Install Dependencies:
   pnpm install

4. Configure Environment:
   cp .env.example .env
   # Edit .env with your settings

5. Start Infrastructure:
   docker-compose up -d

6. Start Development Server:
   pnpm run dev:api

7. Verify Setup:
   curl http://localhost:4000/api/v1/health

VS CODE EXTENSIONS (Recommended):
- ESLint
- Prettier
- Docker
- GitLens
- Thunder Client (API testing)
- Database Client (PostgreSQL)

CODE REVIEW CHECKLIST:

Before Creating Pull Request:
[ ] Code follows naming conventions
[ ] All new code has TypeScript types
[ ] DTOs have validation decorators
[ ] Services have error handling
[ ] Controllers have Swagger documentation
[ ] No console.log() statements
[ ] No commented-out code
[ ] All imports organized
[ ] No unused variables
[ ] Tests pass (when applicable)
[ ] Linter passes (pnpm run lint)
[ ] Build succeeds (pnpm run build)

During Code Review:
[ ] Logic is correct
[ ] Security considerations addressed
[ ] Performance implications considered
[ ] Database queries optimized
[ ] Error messages are helpful
[ ] Code is readable and maintainable
[ ] Follows DDD principles
[ ] No hardcoded values
[ ] Configuration uses environment variables

TESTING WORKFLOW:

Manual Testing:
1. Test happy path
2. Test error cases
3. Test boundary conditions
4. Test authentication/authorization
5. Verify audit logging
6. Check Swagger documentation

Using Swagger UI:
1. Open http://localhost:4000/api/docs
2. Click "Authorize" for protected endpoints
3. Enter: Bearer <your_jwt_token>
4. Test endpoints directly in browser

Using curl:
# Health check
curl http://localhost:4000/api/v1/health

# Register user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","role":"FRONT_DESK"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

# Get current user
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

DATABASE MANAGEMENT:

Access PgAdmin:
1. Open http://localhost:5050
2. Login: admin@blueberryhillsmunnar.in / admin
3. Add Server:
   - Host: postgres
   - Port: 5432
   - Database: blueberry_hms
   - Username: blueberry_admin
   - Password: (from .env)

Common SQL Queries:
-- View all users
SELECT id, email, first_name, last_name, role, status FROM users;

-- View audit logs
SELECT action, entity, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- Check soft deleted records
SELECT email, deleted_at FROM users WHERE deleted_at IS NOT NULL;

-- Active users count by role
SELECT role, COUNT(*) FROM users WHERE deleted_at IS NULL GROUP BY role;

Backup Database:
docker exec blueberry_postgres pg_dump -U blueberry_admin blueberry_hms > backup_$(date +%Y%m%d).sql

Restore Database:
docker exec -i blueberry_postgres psql -U blueberry_admin blueberry_hms < backup_20260305.sql

DEBUGGING TIPS:

API Not Starting:
1. Check Docker services: docker-compose ps
2. Check API logs: docker-compose logs api-core
3. Verify .env file exists and is valid
4. Check port 4000 is not in use: lsof -i :4000

Database Connection Issues:
1. Verify PostgreSQL is running: docker ps | grep postgres
2. Check credentials in .env match docker-compose.yml
3. Try connecting via PgAdmin
4. Check network: docker network ls

Authentication Failing:
1. Verify JWT_SECRET in .env
2. Check token hasn't expired
3. Verify user status is ACTIVE
4. Check user exists: SELECT * FROM users WHERE email = 'xxx';

Audit Logs Not Saving:
1. Check audit_logs table exists
2. Verify AuditModule is imported in AppModule
3. Check interceptor is registered globally
4. View error logs for exceptions

DEPLOYMENT CHECKLIST:

Pre-Deployment:
[ ] All tests passing
[ ] No console.log statements
[ ] Environment variables documented
[ ] Database migrations ready
[ ] Backup current database
[ ] Update version number
[ ] Tag release in Git
[ ] Build succeeds
[ ] Security scan passed

Deployment Steps:
1. Stop current services
2. Pull latest code
3. Run database migrations
4. Update environment variables
5. Build Docker images
6. Start services
7. Verify health check
8. Test critical paths
9. Monitor logs for errors
10. Rollback plan ready

Post-Deployment:
[ ] Health check passing
[ ] All services running
[ ] Database connection active
[ ] Authentication working
[ ] Audit logging functional
[ ] Monitor error logs
[ ] Notify stakeholders

Rollback Procedure:
1. Stop current services
2. Restore database backup
3. Check out previous Git tag
4. Rebuild and restart
5. Verify system health
6. Document incident

PERFORMANCE MONITORING:

Key Metrics:
- API response time
- Database query time
- Memory usage
- CPU usage
- Disk I/O
- Network throughput
- Active connections
- Error rate

Monitoring Tools (Future):
- Prometheus for metrics
- Grafana for dashboards
- Sentry for error tracking
- ELK stack for log aggregation

================================================================================
                        13. TROUBLESHOOTING
================================================================================

COMMON ISSUES AND SOLUTIONS:

ISSUE 1: Docker containers not starting

Symptoms:
- docker-compose up fails
- Containers exit immediately
- Port conflict errors

Solutions:
1. Check if ports are already in use:
   netstat -tulpn | grep :5432
   netstat -tulpn | grep :4000

2. Stop conflicting services:
   sudo systemctl stop postgresql

3. Remove old containers and volumes:
   docker-compose down -v
   docker system prune

4. Check Docker daemon is running:
   sudo systemctl status docker

5. Verify docker-compose.yml syntax:
   docker-compose config

ISSUE 2: PostgreSQL connection failed

Symptoms:
- API cannot connect to database
- Error: "getaddrinfo EAI_AGAIN postgres"
- Connection timeout

Solutions:
1. Verify PostgreSQL container is running:
   docker ps | grep postgres

2. Check DB_HOST in .env:
   - Use "localhost" if API runs outside Docker
   - Use "postgres" if API runs inside Docker

3. Test connection manually:
   docker exec -it blueberry_postgres psql -U blueberry_admin -d blueberry_hms

4. Check credentials match:
   Compare .env with docker-compose.yml

5. Restart PostgreSQL:
   docker-compose restart postgres

ISSUE 3: JWT authentication fails

Symptoms:
- Login returns 401 Unauthorized
- Valid token rejected
- "Invalid token" error

Solutions:
1. Verify JWT_SECRET is set in .env:
   grep JWT_SECRET .env

2. Get fresh token by logging in again:
   Token might have expired (7 days)

3. Check token format:
   Should be: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. Verify user exists and is ACTIVE:
   SELECT email, status FROM users WHERE email = 'xxx';

5. Check API logs for JWT errors:
   Look for "JWT validation failed" messages

ISSUE 4: Password validation errors

Symptoms:
- Cannot register user
- "Password must contain uppercase, lowercase, and number"
- Password too short error

Solutions:
1. Follow password requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. Example valid passwords:
   - Admin@2026
   - Secure123!
   - Manager@Pass

3. Check DTO validation rules:
   Look at register.dto.ts

ISSUE 5: Email already registered

Symptoms:
- Cannot create user
- "Email already registered" error
- 409 Conflict response

Solutions:
1. Check if user exists:
   SELECT email, deleted_at FROM users WHERE email = 'xxx';

2. If user is soft-deleted, restore or use different email

3. If duplicate, use different email or delete existing:
   DELETE FROM users WHERE email = 'xxx' AND deleted_at IS NOT NULL;

ISSUE 6: API returns 500 Internal Server Error

Symptoms:
- Unexpected server error
- No specific error message
- Stack trace in logs

Solutions:
1. Check API logs:
   docker-compose logs api-core
   or
   Check terminal where API is running

2. Common causes:
   - Database connection lost
   - Missing environment variable
   - Unhandled exception in code

3. Restart API:
   Ctrl+C and run: pnpm run dev:api

4. Check database is accessible:
   docker exec -it blueberry_postgres psql -U blueberry_admin -d blueberry_hms -c "SELECT 1;"

ISSUE 7: Swagger docs not loading

Symptoms:
- http://localhost:4000/api/docs returns 404
- Blank page or error

Solutions:
1. Verify API is running:
   curl http://localhost:4000/api/v1/health

2. Check Swagger setup in main.ts:
   Should have SwaggerModule.setup('api/docs', app, document);

3. Clear browser cache

4. Try different browser

5. Check console for JavaScript errors

ISSUE 8: Audit logs not being created

Symptoms:
- No entries in audit_logs table
- Operations not tracked

Solutions:
1. Verify audit_logs table exists:
   docker exec -it blueberry_postgres psql -U blueberry_admin -d blueberry_hms -c "\d audit_logs"

2. Check AuditModule is imported in AppModule:
   Look at app.module.ts imports array

3. Verify interceptor is registered:
   Should be in providers as APP_INTERCEPTOR

4. Check for errors in API logs

5. Test manually:
   Create a user and check:
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1;

ISSUE 9: TypeORM synchronize not creating tables

Symptoms:
- Tables not created in database
- "relation does not exist" errors

Solutions:
1. Check synchronize is true in database.config.ts:
   synchronize: configService.get('NODE_ENV') === 'development'

2. Verify NODE_ENV=development in .env

3. Drop and recreate database:
   docker exec -it blueberry_postgres psql -U blueberry_admin -c "DROP DATABASE blueberry_hms;"
   docker exec -it blueberry_postgres psql -U blueberry_admin -c "CREATE DATABASE blueberry_hms;"

4. Restart API to trigger schema sync

ISSUE 10: pnpm install fails

Symptoms:
- Dependency installation errors
- "Cannot find module" errors
- Version conflicts

Solutions:
1. Clear pnpm cache:
   pnpm store prune

2. Delete node_modules and lockfile:
   rm -rf node_modules pnpm-lock.yaml

3. Reinstall:
   pnpm install

4. Check Node.js version:
   node --version
   (Should be 18.x or higher)

5. Update pnpm:
   npm install -g pnpm@latest

GETTING HELP:

Internal Resources:
- Project documentation (this file)
- Code comments in source files
- Swagger API documentation
- Git commit history

External Resources:
- NestJS documentation: https://docs.nestjs.com
- TypeORM documentation: https://typeorm.io
- Docker documentation: https://docs.docker.com
- PostgreSQL documentation: https://www.postgresql.org/docs

Contact Information:
- Technical Lead: [Contact info]
- DevOps Team: [Contact info]
- Mattel Group IT: [Contact info]

ERROR LOG LOCATIONS:

Development:
- API Console: Terminal where "pnpm run dev:api" is running
- Docker Logs: docker-compose logs api-core
- PostgreSQL Logs: docker-compose logs postgres

Production:
- Application Logs: /var/log/blueberry-hms/
- System Logs: /var/log/syslog
- Nginx/Caddy Logs: /var/log/caddy/

HEALTH CHECK COMMANDS:

Quick System Check:
# Check all services
docker-compose ps

# API health
curl http://localhost:4000/api/v1/health

# Database connection
docker exec -it blueberry_postgres psql -U blueberry_admin -d blueberry_hms -c "SELECT version();"

# Redis connection
docker exec -it blueberry_redis redis-cli ping

# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep node

================================================================================
                            DOCUMENT END
================================================================================

This documentation is maintained by the Blueberry HMS development team.
For updates or corrections, please submit a pull request.

Last Updated: March 5, 2026
Version: 1.0.0
Status: Phase 2 Complete
Next Phase: Room Management (Phase 3)

================================================================================
