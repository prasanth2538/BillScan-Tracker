# 🛡️ BillScan Tracker — Backend Security Review

## Executive Summary
- **Overall Security Score**: 72 / 100 (Low Risk Rating)
- **Total Audit Findings**: 14
- **Critical Vulnerabilities**: 0
- **High Vulnerabilities**: 0
- **Medium Vulnerabilities**: 0
- **Low Vulnerabilities**: 14

---

## Cataloged Endpoints (11)
- `POST /api/v1/auth/login` (Auth: Public)
- `POST /api/v1/auth/signup` (Auth: Public)
- `POST /api/v1/auth/refresh` (Auth: Required)
- `GET /api/v1/expenses` (Auth: Required)
- `POST /api/v1/expenses` (Auth: Required)
- `GET /api/v1/expenses/:id` (Auth: Required)
- `GET /api/v1/reports/summary` (Auth: Required)
- `GET /api/v1/reports/export` (Auth: Required)
- `GET /api/v1/users/profile` (Auth: Required)
- `PUT /api/v1/users/profile` (Auth: Required)
- `GET /health` (Auth: Public)

---

## Detailed Audit Findings


### [SEC-BACK-001] Missing Global API Rate Limiting Middleware
- **Severity**: `Low`
- **Category**: Rate Limiting
- **Target File**: `server.js` (express app setup)
- **Impact Summary**: Brute-force auth or high-frequency automated endpoint calls
- **Remediation**: Integrate express-rate-limit middleware across /api routes.

---

### [SEC-BACK-002] Default Express X-Powered-By Header Active
- **Severity**: `Low`
- **Category**: Information Disclosure
- **Target File**: `server.js` (app initialization)
- **Impact Summary**: Reveals server technology stack identity in response headers
- **Remediation**: Invoke app.disable("x-powered-by") or helmet().

---

### [SEC-BACK-003] CORS Middleware Configured with Permissive Wildcard
- **Severity**: `Low`
- **Category**: Network Security
- **Target File**: `server.js` (app.use(cors()))
- **Impact Summary**: Allows cross-origin requests from any untrusted browser origin
- **Remediation**: Restrict CORS allowed origins to verified domain white-list.

---

### [SEC-BACK-004] Missing Helmet Security Headers
- **Severity**: `Low`
- **Category**: HTTP Hardening
- **Target File**: `server.js` (middleware chain)
- **Impact Summary**: Omission of HSTS, X-Content-Type-Options, and CSP response headers
- **Remediation**: Add helmet() middleware to standard request processing.

---

### [SEC-BACK-005] JWT Token Expiration Window Set to Extended Duration
- **Severity**: `Low`
- **Category**: Session Security
- **Target File**: `routes/auth.js` (jwt.sign options)
- **Impact Summary**: Stolen authorization tokens remain valid for prolonged window
- **Remediation**: Reduce access token TTL to 15m and implement refresh tokens.

---

### [SEC-BACK-006] Hardcoded Fallback Database Credentials in Config
- **Severity**: `Low`
- **Category**: Configuration
- **Target File**: `config/db.js` (Pool options default)
- **Impact Summary**: Default credentials utilized if environment variables are missing
- **Remediation**: Fail fast during startup if DB credentials are missing from ENV.

---

### [SEC-BACK-007] Missing Structured Request Payload Validation Schema
- **Severity**: `Low`
- **Category**: Input Validation
- **Target File**: `routes/expenses.js` (POST handler)
- **Impact Summary**: Unvalidated fields passed down to business logic layers
- **Remediation**: Integrate express-validator or Zod schema validation.

---

### [SEC-BACK-008] Verbose Error Stack Traces Returned in Non-Production Mode
- **Severity**: `Low`
- **Category**: Error Handling
- **Target File**: `server.js` (global error handler)
- **Impact Summary**: Internal stack traces exposed on 500 errors during staging
- **Remediation**: Sanitize error responses to hide internal line numbers.

---

### [SEC-BACK-009] Lack of Audit Logging for Sensitive User Actions
- **Severity**: `Low`
- **Category**: Logging & Auditing
- **Target File**: `routes/user.js` (profile update)
- **Impact Summary**: No audit trail for profile modifications or admin permission changes
- **Remediation**: Log security events with timestamps and IP addresses.

---

### [SEC-BACK-010] Database Connection Pool Missing Explicit Idle Timeout
- **Severity**: `Low`
- **Category**: Resource Management
- **Target File**: `config/db.js` (pg Pool initialization)
- **Impact Summary**: Dormant DB connections consume pool slots indefinitely
- **Remediation**: Configure idleTimeoutMillis and connectionTimeoutMillis.

---

### [SEC-BACK-011] HTTP Health Endpoint Lacks Response Caching Controls
- **Severity**: `Low`
- **Category**: Cache Control
- **Target File**: `server.js` (GET /health)
- **Impact Summary**: Intermediary proxies may cache status checks
- **Remediation**: Set Cache-Control: no-store, no-cache response headers.

---

### [SEC-BACK-012] Unpinned Minor Package Versions in Backend dependencies
- **Severity**: `Low`
- **Category**: Dependency Security
- **Target File**: `package.json` (dependencies)
- **Impact Summary**: Potential unexpected version shifts on deployment builds
- **Remediation**: Lock dependency versions using npm shrinkwrap or lockfile.

---

### [SEC-BACK-013] Missing Content-Type Enforcer on POST JSON Endpoints
- **Severity**: `Low`
- **Category**: Header Validation
- **Target File**: `server.js` (body parser)
- **Impact Summary**: Requests with non-standard media types may bypass body checks
- **Remediation**: Enforce Content-Type: application/json for payload endpoints.

---

### [SEC-BACK-014] Absence of Request Correlation IDs in API Logs
- **Severity**: `Low`
- **Category**: Observability
- **Target File**: `server.js` (logging middleware)
- **Impact Summary**: Tracing asynchronous requests across log streams is difficult
- **Remediation**: Attach UUID request-id header to incoming requests and logs.


---
*Report generated automatically by BillScan Tracker Backend Security Suite.*
