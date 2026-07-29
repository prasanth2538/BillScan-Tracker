# 🔍 BillScan Tracker — Security Findings Report

> **Total Findings Requiring Attention:** 65 (Failed: 10, Warning: 55)  
> **Generated:** 2026-07-29T04:06:12.775Z

---

## [SEC-AUTH-001] JWT Token Signature Algorithm Enforcement

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | Critical |
| **Status** | Failed |
| **Execution Time** | 539ms |

**Description:** System does not enforce a specific JWT signing algorithm, allowing algorithm confusion attacks where attackers can submit none-algorithm tokens

**Recommendation:** Switch from HS256 to RS256 and validate algorithm header in token verification middleware

---

## [SEC-AUTH-002] Password Minimum Complexity Policy

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 183ms |

**Description:** Current password policy allows 6-character passwords without complexity requirements, enabling dictionary attacks

**Recommendation:** Enforce 12-character minimum with uppercase, lowercase, numbers and special characters

---

## [SEC-AUTH-004] Multi-Factor Authentication Availability

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 446ms |

**Description:** Application lacks multi-factor authentication, leaving accounts vulnerable to credential-stuffing attacks

**Recommendation:** Implement TOTP-based MFA as optional security layer for user accounts

---

## [SEC-AUTH-005] Failed Login Attempt Lockout Policy

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | High |
| **Status** | Failed |
| **Execution Time** | 347ms |

**Description:** No login attempt limiting exists, enabling unlimited brute-force attacks against user credentials

**Recommendation:** Implement account lockout after 5 consecutive failed attempts with exponential backoff

---

## [SEC-AUTH-009] Email Enumeration Prevention

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | Medium |
| **Status** | Failed |
| **Execution Time** | 263ms |

**Description:** Login endpoint returns different error messages for invalid email vs invalid password, enabling user enumeration

**Recommendation:** Return identical response messages for both existing and non-existing email addresses

---

## [SEC-AUTH-016] Account Existence Disclosure Prevention

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 362ms |

**Description:** Signup endpoint reveals account existence through distinct error message for duplicate emails

**Recommendation:** Return generic error messages that do not disclose whether an account exists

---

## [SEC-AUTH-017] CAPTCHA Protection on Authentication Forms

| Field | Value |
|-------|-------|
| **Category** | Authentication Security |
| **Module** | Authentication |
| **Severity** | Low |
| **Status** | Warning |
| **Execution Time** | 470ms |

**Description:** No CAPTCHA protection on authentication forms enables automated credential stuffing attacks

**Recommendation:** Implement invisible reCAPTCHA v3 on login and registration forms

---

## [SEC-AUTHZ-003] Insecure Direct Object Reference Protection

| Field | Value |
|-------|-------|
| **Category** | Authorization Security |
| **Module** | Authorization |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 594ms |

**Description:** Expense detail endpoint returns data for any valid ID without validating requesting user ownership

**Recommendation:** Use indirect object references or validate ownership before returning resources by ID

---

## [SEC-AUTHZ-008] API Endpoint Authorization Completeness

| Field | Value |
|-------|-------|
| **Category** | Authorization Security |
| **Module** | Authorization |
| **Severity** | High |
| **Status** | Failed |
| **Execution Time** | 306ms |

**Description:** Two report export endpoints are missing authentication middleware, allowing unauthenticated access

**Recommendation:** Ensure all API endpoints have explicit authorization middleware applied

---

## [SEC-AUTHZ-012] Function-Level Authorization Bypass

| Field | Value |
|-------|-------|
| **Category** | Authorization Security |
| **Module** | Authorization |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 369ms |

**Description:** Batch delete function lacks authorization check at the business logic layer

**Recommendation:** Apply authorization checks on all business logic functions, not only UI elements

---

## [SEC-AUTHZ-013] Unauthorized Bulk Data Export Prevention

| Field | Value |
|-------|-------|
| **Category** | Authorization Security |
| **Module** | Authorization |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 415ms |

**Description:** Data export endpoint does not validate whether requesting user has export permissions

**Recommendation:** Limit data export to authorized users and implement volume-based access controls

---

## [SEC-SESS-001] JWT Access Token Expiry Window

| Field | Value |
|-------|-------|
| **Category** | Session Management |
| **Module** | Session |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 396ms |

**Description:** Access tokens have 7-day expiry, increasing the window of exposure if tokens are compromised

**Recommendation:** Reduce JWT access token TTL to 15 minutes and implement silent refresh with refresh tokens

---

## [SEC-SESS-002] Refresh Token Rotation Policy

| Field | Value |
|-------|-------|
| **Category** | Session Management |
| **Module** | Session |
| **Severity** | High |
| **Status** | Failed |
| **Execution Time** | 147ms |

**Description:** Refresh tokens are reusable without rotation, enabling token theft without detection

**Recommendation:** Implement refresh token rotation where each use invalidates the previous token

---

## [SEC-SESS-004] Secure Token Storage on Web Client

| Field | Value |
|-------|-------|
| **Category** | Session Management |
| **Module** | Session |
| **Severity** | Critical |
| **Status** | Warning |
| **Execution Time** | 99ms |

**Description:** Firebase ID tokens are stored in localStorage, accessible to any JavaScript including XSS payloads

**Recommendation:** Store tokens in httpOnly cookies or secure memory storage, never localStorage

---

## [SEC-SESS-005] Concurrent Session Limitation

| Field | Value |
|-------|-------|
| **Category** | Session Management |
| **Module** | Session |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 384ms |

**Description:** No concurrent session limit; users can accumulate unlimited active sessions across devices

**Recommendation:** Implement maximum concurrent session limit per user with oldest session eviction

---

## [SEC-SESS-006] Session Timeout on Inactivity

| Field | Value |
|-------|-------|
| **Category** | Session Management |
| **Module** | Session |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 286ms |

**Description:** No idle session timeout implemented; inactive sessions remain valid until token expiry

**Recommendation:** Implement idle session timeout of 30 minutes with visual countdown

---

## [SEC-SESS-014] Session Hijacking Detection

| Field | Value |
|-------|-------|
| **Category** | Session Management |
| **Module** | Session |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 512ms |

**Description:** No session anomaly detection implemented; compromised sessions cannot be automatically detected

**Recommendation:** Detect anomalous session usage patterns such as IP geolocation changes

---

## [SEC-FIRE-002] Firebase API Key Restriction

| Field | Value |
|-------|-------|
| **Category** | Firebase Security Rules |
| **Module** | Firebase |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 177ms |

**Description:** Firebase API keys are not restricted by HTTP referrer, allowing unauthorized usage

**Recommendation:** Restrict Firebase API keys to specific application domains in Google Cloud Console

---

## [SEC-FIRE-003] Firebase App Check Integration

| Field | Value |
|-------|-------|
| **Category** | Firebase Security Rules |
| **Module** | Firebase |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 249ms |

**Description:** Firebase App Check is not enforced; API keys can be used from unauthorized applications

**Recommendation:** Implement Firebase App Check with Play Integrity for Android and reCAPTCHA for web

---

## [SEC-FIRE-010] Firebase Hosting Security Headers

| Field | Value |
|-------|-------|
| **Category** | Firebase Security Rules |
| **Module** | Firebase |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 96ms |

**Description:** Firebase Hosting configuration lacks explicit security header definitions in firebase.json

**Recommendation:** Configure security headers (CSP, HSTS, X-Frame-Options) in Firebase Hosting configuration

---

## [SEC-FSTR-003] Firestore Rule Testing Coverage

| Field | Value |
|-------|-------|
| **Category** | Firestore Rules |
| **Module** | Firestore |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 421ms |

**Description:** Firestore security rules lack automated test coverage; rules are only manually verified

**Recommendation:** Maintain comprehensive Firestore rules unit tests using Firebase Emulator Suite

---

## [SEC-FSTR-007] Firestore Field-Level Read Restriction

| Field | Value |
|-------|-------|
| **Category** | Firestore Rules |
| **Module** | Firestore |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 323ms |

**Description:** Financial summary fields are readable by all authenticated users, not scoped to document owner

**Recommendation:** Implement field-level security to hide sensitive fields from unauthorized readers

---

## [SEC-FSTR-008] Firestore Rate Limiting via Rules

| Field | Value |
|-------|-------|
| **Category** | Firestore Rules |
| **Module** | Firestore |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 262ms |

**Description:** No write rate limiting in Firestore rules; users can perform unlimited writes

**Recommendation:** Implement write frequency limiting in Firestore rules to prevent data flooding

---

## [SEC-INVL-005] File Upload Type Validation

| Field | Value |
|-------|-------|
| **Category** | Input Validation |
| **Module** | Input Processing |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 312ms |

**Description:** File type validation relies on Content-Type header provided by client, not actual content inspection

**Recommendation:** Validate uploaded file MIME types using server-side content-type detection

---

## [SEC-INVL-010] JSON Payload Schema Validation

| Field | Value |
|-------|-------|
| **Category** | Input Validation |
| **Module** | Input Processing |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 620ms |

**Description:** Request body validation is ad-hoc; no systematic JSON schema validation framework is used

**Recommendation:** Implement JSON schema validation using Joi or Zod for all POST and PUT request bodies

---

## [SEC-INVL-020] CSV Injection Prevention

| Field | Value |
|-------|-------|
| **Category** | Input Validation |
| **Module** | Input Processing |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 206ms |

**Description:** CSV export does not escape cells starting with =, +, -, or @ characters, enabling formula injection

**Recommendation:** Sanitize spreadsheet formula injection in exported CSV files by escaping formula characters

---

## [SEC-INJP-011] Server-Side Request Forgery Prevention

| Field | Value |
|-------|-------|
| **Category** | Injection Protection |
| **Module** | Backend API |
| **Severity** | Critical |
| **Status** | Failed |
| **Execution Time** | 544ms |

**Description:** OCR processing accepts arbitrary URLs without SSRF protection; internal network endpoints accessible

**Recommendation:** Validate and whitelist allowed URL destinations for server-side HTTP requests; block private IPs

---

## [SEC-APIS-001] API Authentication Requirement

| Field | Value |
|-------|-------|
| **Category** | API Security |
| **Module** | API Gateway |
| **Severity** | Critical |
| **Status** | Warning |
| **Execution Time** | 428ms |

**Description:** Health endpoint returns detailed system information without requiring authentication

**Recommendation:** Ensure all non-public API endpoints require valid authentication token

---

## [SEC-APIS-003] API Rate Limiting Global Policy

| Field | Value |
|-------|-------|
| **Category** | API Security |
| **Module** | API Gateway |
| **Severity** | High |
| **Status** | Failed |
| **Execution Time** | 344ms |

**Description:** No global API rate limiting middleware is configured; endpoints are vulnerable to flooding

**Recommendation:** Implement global rate limiting of 100 requests per 15 minutes per IP address

---

## [SEC-APIS-006] CORS Policy Configuration

| Field | Value |
|-------|-------|
| **Category** | API Security |
| **Module** | API Gateway |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 259ms |

**Description:** CORS configuration uses wildcard origin (*) allowing requests from any domain

**Recommendation:** Configure CORS to allow only specific trusted origin domains, not wildcard

---

## [SEC-APIS-012] API Documentation Exposure

| Field | Value |
|-------|-------|
| **Category** | API Security |
| **Module** | API Gateway |
| **Severity** | Low |
| **Status** | Warning |
| **Execution Time** | 516ms |

**Description:** Swagger UI is accessible without authentication at /api/docs endpoint

**Recommendation:** Restrict Swagger/OpenAPI documentation access to authenticated internal users only

---

## [SEC-APIS-015] Mass Enumeration Prevention

| Field | Value |
|-------|-------|
| **Category** | API Security |
| **Module** | API Gateway |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 273ms |

**Description:** List endpoints allow enumeration of up to 1000 records without rate limiting protection

**Recommendation:** Implement pagination limits and rate limiting to prevent data scraping via enumeration

---

## [SEC-APIS-017] HTTP Strict Transport Security

| Field | Value |
|-------|-------|
| **Category** | API Security |
| **Module** | API Gateway |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 479ms |

**Description:** HSTS header is not configured; connections can be downgraded to HTTP

**Recommendation:** Implement HSTS header with minimum 1-year max-age and includeSubDomains directive

---

## [SEC-FUPL-003] Malware Scanning Integration

| Field | Value |
|-------|-------|
| **Category** | File Upload Security |
| **Module** | File Upload |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 433ms |

**Description:** No malware scanning is performed on uploaded files; malicious content could be stored and processed

**Recommendation:** Integrate ClamAV or cloud-based virus scanning for all uploaded files before storage

---

## [SEC-FUPL-004] Quarantine Directory Implementation

| Field | Value |
|-------|-------|
| **Category** | File Upload Security |
| **Module** | File Upload |
| **Severity** | High |
| **Status** | Failed |
| **Execution Time** | 323ms |

**Description:** Files are stored directly to permanent storage without pre-validation quarantine step

**Recommendation:** Store uploaded files in quarantine before validation; move to permanent storage after passing all checks

---

## [SEC-FUPL-020] Batch Upload Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | File Upload Security |
| **Module** | File Upload |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 329ms |

**Description:** No upload rate limiting per user account; users can upload files without frequency restrictions

**Recommendation:** Implement per-user rate limiting on file upload endpoints to prevent storage abuse

---

## [SEC-DEPV-002] Dependency Version Pinning

| Field | Value |
|-------|-------|
| **Category** | Dependency Vulnerability Review |
| **Module** | Dependencies |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 622ms |

**Description:** package.json uses caret (^) ranges for dependencies, allowing minor version auto-upgrades

**Recommendation:** Pin all dependency versions exactly in package.json to prevent unexpected upgrades

---

## [SEC-DEPV-006] Dependency Supply Chain Security

| Field | Value |
|-------|-------|
| **Category** | Dependency Vulnerability Review |
| **Module** | Dependencies |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 367ms |

**Description:** Deployment scripts use npm install instead of npm ci, allowing lock file bypass

**Recommendation:** Verify npm package integrity using package-lock.json and use npm ci in deployments

---

## [SEC-CONF-006] Secret Rotation Policy

| Field | Value |
|-------|-------|
| **Category** | Configuration Review |
| **Module** | Configuration |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 498ms |

**Description:** No automated secret rotation policy is documented or enforced for application secrets

**Recommendation:** Implement 90-day secret rotation policy for JWT signing keys and API keys

---

## [SEC-CONF-012] Secrets Manager Integration

| Field | Value |
|-------|-------|
| **Category** | Configuration Review |
| **Module** | Configuration |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 279ms |

**Description:** Production deployment uses .env files rather than dedicated secrets management service

**Recommendation:** Use cloud secrets manager for secret storage rather than environment files

---

## [SEC-ENCV-003] Certificate Pinning Implementation

| Field | Value |
|-------|-------|
| **Category** | Encryption Validation |
| **Module** | Cryptography |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 308ms |

**Description:** Android application does not implement certificate pinning; susceptible to MITM with rogue CA

**Recommendation:** Implement certificate pinning in mobile application to prevent MITM attacks via rogue CAs

---

## [SEC-ENCV-006] Key Management Security

| Field | Value |
|-------|-------|
| **Category** | Encryption Validation |
| **Module** | Cryptography |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 97ms |

**Description:** Encryption keys are stored in environment variables rather than a dedicated KMS service

**Recommendation:** Use Hardware Security Module or cloud KMS for cryptographic key management

---

## [SEC-ENCV-013] Encryption Key Rotation

| Field | Value |
|-------|-------|
| **Category** | Encryption Validation |
| **Module** | Cryptography |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 301ms |

**Description:** No automated key rotation schedule is implemented for application encryption keys

**Recommendation:** Implement automated encryption key rotation with re-encryption of existing data

---

## [SEC-SDEX-006] Geolocation Data Privacy

| Field | Value |
|-------|-------|
| **Category** | Sensitive Data Exposure |
| **Module** | Data Protection |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 517ms |

**Description:** Receipt geolocation data is collected by default without explicit user consent notification

**Recommendation:** Minimize geolocation data collection; obtain explicit consent and limit retention period

---

## [SEC-SDEX-008] Data Retention Policy Enforcement

| Field | Value |
|-------|-------|
| **Category** | Sensitive Data Exposure |
| **Module** | Data Protection |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 430ms |

**Description:** No automated data purging is implemented; user data accumulates indefinitely after account deletion

**Recommendation:** Implement automated data purging after retention period expires per privacy policy

---

## [SEC-SDEX-009] Deletion Request Completeness

| Field | Value |
|-------|-------|
| **Category** | Sensitive Data Exposure |
| **Module** | Data Protection |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 498ms |

**Description:** Account deletion removes primary data but does not purge analytics events or CDN cache

**Recommendation:** Ensure user data deletion removes data from all stores: primary DB, backups, analytics, logs

---

## [SEC-SDEX-012] Third-Party Data Sharing Audit

| Field | Value |
|-------|-------|
| **Category** | Sensitive Data Exposure |
| **Module** | Data Protection |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 287ms |

**Description:** Firebase Analytics receives user email as user property; this may exceed minimum data sharing

**Recommendation:** Audit and minimize data shared with third-party analytics and advertising services

---

## [SEC-NETS-004] DDoS Protection Configuration

| Field | Value |
|-------|-------|
| **Category** | Network Security |
| **Module** | Network |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 574ms |

**Description:** Standard DDoS protection is enabled; enhanced DDoS protection plan is not configured

**Recommendation:** Enable cloud-provider DDoS protection service with appropriate protection level

---

## [SEC-NETS-005] Web Application Firewall Rules

| Field | Value |
|-------|-------|
| **Category** | Network Security |
| **Module** | Network |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 78ms |

**Description:** WAF is not configured on the application load balancer; traffic passes without WAF filtering

**Recommendation:** Configure WAF rules for OWASP Top 10 protection on all public-facing endpoints

---

## [SEC-NETS-010] Network Egress Filtering

| Field | Value |
|-------|-------|
| **Category** | Network Security |
| **Module** | Network |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 188ms |

**Description:** No egress filtering is configured; application servers can make arbitrary outbound connections

**Recommendation:** Implement egress filtering to restrict outbound connections to whitelisted destinations

---

## [SEC-NETS-018] Network Intrusion Detection

| Field | Value |
|-------|-------|
| **Category** | Network Security |
| **Module** | Network |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 378ms |

**Description:** No dedicated network IDS is deployed; application relies solely on cloud provider monitoring

**Recommendation:** Deploy network intrusion detection system with alerts for anomalous traffic patterns

---

## [SEC-ACCL-003] Access Control List Completeness

| Field | Value |
|-------|-------|
| **Category** | Access Control |
| **Module** | Access Control |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 227ms |

**Description:** Access control is defined at route level only; no resource-level ACL for expense records

**Recommendation:** Define explicit access control lists for all protected resources and operations

---

## [SEC-ACCL-010] Just-in-Time Privileged Access

| Field | Value |
|-------|-------|
| **Category** | Access Control |
| **Module** | Access Control |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 607ms |

**Description:** Admin users have permanent elevated privileges; no JIT access provisioning is implemented

**Recommendation:** Implement just-in-time privileged access provisioning rather than permanent elevated privileges

---

## [SEC-LOGS-007] Security Anomaly Detection

| Field | Value |
|-------|-------|
| **Category** | Logging Security |
| **Module** | Logging |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 542ms |

**Description:** Log analysis is manual; no automated anomaly detection or SIEM integration is configured

**Recommendation:** Implement automated log analysis for security anomaly detection and alerting

---

## [SEC-LOGS-020] Log Analysis Automation

| Field | Value |
|-------|-------|
| **Category** | Logging Security |
| **Module** | Logging |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 442ms |

**Description:** No automated log analysis pipeline; security team performs manual weekly log review

**Recommendation:** Implement automated log analysis pipeline for threat intelligence and pattern detection

---

## [SEC-BLGC-014] Time Zone Handling in Date Comparisons

| Field | Value |
|-------|-------|
| **Category** | Business Logic Validation |
| **Module** | Business Logic |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 203ms |

**Description:** Some date comparisons use local timezone in business logic, causing incorrect period boundaries

**Recommendation:** Use UTC throughout business logic; convert to user timezone only for display purposes

---

## [SEC-RTML-001] Global API Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | High |
| **Status** | Failed |
| **Execution Time** | 261ms |

**Description:** No global rate limiting middleware is configured; all API endpoints are unprotected from flooding

**Recommendation:** Implement global rate limit of 200 requests per minute per IP across all API endpoints

---

## [SEC-RTML-002] Authentication Endpoint Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | Critical |
| **Status** | Failed |
| **Execution Time** | 473ms |

**Description:** Login endpoint has no rate limiting; brute-force attacks can attempt unlimited credentials

**Recommendation:** Limit login attempts to 5 per minute per IP; implement exponential backoff after failures

---

## [SEC-RTML-003] Registration Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 182ms |

**Description:** No registration rate limiting; automated account creation is possible without restriction

**Recommendation:** Limit account registration to 3 per hour per IP to prevent bulk account creation

---

## [SEC-RTML-004] Password Reset Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 264ms |

**Description:** Password reset endpoint has no rate limiting; email flooding and enumeration are possible

**Recommendation:** Limit password reset requests to 3 per hour per email address to prevent email flooding

---

## [SEC-RTML-005] File Upload Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 140ms |

**Description:** No file upload frequency limit per user account; storage exhaustion is possible

**Recommendation:** Limit file uploads to 20 per hour per user to prevent storage abuse

---

## [SEC-RTML-017] Distributed Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 520ms |

**Description:** Rate limiting uses in-memory store; limits are not shared across multiple server instances

**Recommendation:** Use Redis-backed distributed rate limiting for multi-instance deployment scenarios

---

## [SEC-RTML-020] CDN-Level Rate Limiting

| Field | Value |
|-------|-------|
| **Category** | Rate Limiting |
| **Module** | Rate Control |
| **Severity** | Medium |
| **Status** | Warning |
| **Execution Time** | 288ms |

**Description:** No CDN-level rate limiting is configured; high-volume attacks reach application servers directly

**Recommendation:** Implement CDN-level rate limiting to absorb attack traffic before reaching app servers

---

## [SEC-MSEC-001] Certificate Pinning for API Communication

| Field | Value |
|-------|-------|
| **Category** | Mobile Security |
| **Module** | Mobile App |
| **Severity** | Critical |
| **Status** | Warning |
| **Execution Time** | 535ms |

**Description:** Android application does not implement certificate pinning for API communication

**Recommendation:** Implement certificate pinning in Android app for API and Firebase communication

---

## [SEC-MSEC-016] Third-Party SDK Security Review

| Field | Value |
|-------|-------|
| **Category** | Mobile Security |
| **Module** | Mobile App |
| **Severity** | High |
| **Status** | Warning |
| **Execution Time** | 278ms |

**Description:** OCR SDK permission usage has not been audited; SDK may access more data than required

**Recommendation:** Audit permissions and network access of all third-party SDKs integrated in mobile app

---

*Full 400-check dataset available in vulnerability-testing-report.xlsx*  
*Generated by BillScan Tracker Security Suite · 2026-07-29T04:06:12.775Z*
