# 🛡️ BillScan Tracker — Web Frontend Security Review

## Executive Summary
- **Overall Security Score**: 72 / 100 (Low Risk Rating)
- **Total Audit Findings**: 14
- **Critical Vulnerabilities**: 0
- **High Vulnerabilities**: 0
- **Medium Vulnerabilities**: 0
- **Low Vulnerabilities**: 14

---

## Detailed Audit Findings


### [SEC-WEB-001] PII & Auth Token Stored in Unencrypted localStorage
- **Severity**: `Low`
- **Category**: Client Storage
- **Target File**: `src/context/AuthContext.tsx` (localStorage.setItem("user"))
- **Impact Summary**: Sensitive user profile data accessible to XSS vectors
- **Recommended Action**: Migrate session tokens to HttpOnly, SameSite=Strict cookies.

---

### [SEC-WEB-002] Missing Client-Side Session Idle Timeout (TTL)
- **Severity**: `Low`
- **Category**: Session Management
- **Target File**: `src/context/AuthContext.tsx` (AuthContext Provider)
- **Impact Summary**: Dormant browser sessions remain valid indefinitely
- **Recommended Action**: Implement an active user activity listener with a 15-minute expiration timer.

---

### [SEC-WEB-003] Content-Security-Policy (CSP) Meta Tag Missing in HTML Header
- **Severity**: `Low`
- **Category**: Browser Hardening
- **Target File**: `index.html` (<head> element)
- **Impact Summary**: No restriction on script execution origins or inline styles
- **Recommended Action**: Add restrictive CSP meta tag enforcing script-src default-src policies.

---

### [SEC-WEB-004] Missing X-Frame-Options Meta / Framebuster Guard
- **Severity**: `Low`
- **Category**: UI Security
- **Target File**: `index.html` (<head> element)
- **Impact Summary**: Application vulnerable to clickjacking frame embedding
- **Recommended Action**: Configure frame-ancestors directive in CSP and set DENY headers.

---

### [SEC-WEB-005] Hardcoded API Base URL Endpoint in Client Configuration
- **Severity**: `Low`
- **Category**: Configuration
- **Target File**: `src/App.tsx` (API Base Constant)
- **Impact Summary**: Exposes internal staging domain references in client JS bundles
- **Recommended Action**: Externalize endpoints via environment variables VITE_API_URL.

---

### [SEC-WEB-006] Missing Subresource Integrity (SRI) Hashes on CDN Assets
- **Severity**: `Low`
- **Category**: Asset Integrity
- **Target File**: `index.html` (Google Fonts / External CSS)
- **Impact Summary**: CDN compromise could inject untrusted script payloads
- **Recommended Action**: Include integrity cryptographic hashes and crossorigin attributes.

---

### [SEC-WEB-007] Potential InnerHTML Direct DOM Manipulation in OCR Component
- **Severity**: `Low`
- **Category**: XSS Prevention
- **Target File**: `src/pages/ReportsScreen.tsx` (HTML Output Container)
- **Impact Summary**: Improperly sanitized receipt preview text could trigger script execution
- **Recommended Action**: Use DOMPurify library prior to raw HTML insertion.

---

### [SEC-WEB-008] Sensitive Input Fields Lacking autocomplete Off Directives
- **Severity**: `Low`
- **Category**: Form Security
- **Target File**: `src/pages/LoginScreen.tsx` (<input type="password">)
- **Impact Summary**: Shared workstation browsers may cache sensitive credentials
- **Recommended Action**: Set autocomplete="current-password" and autocomplete="off".

---

### [SEC-WEB-009] Missing Referrer-Policy Meta Restriction
- **Severity**: `Low`
- **Category**: Information Disclosure
- **Target File**: `index.html` (<head> element)
- **Impact Summary**: Full URL path including route state sent to third-party endpoints
- **Recommended Action**: Add <meta name="referrer" content="strict-origin-when-cross-origin">.

---

### [SEC-WEB-10] Client State Cache Not Cleared Completely on Logout Event
- **Severity**: `Low`
- **Category**: State Security
- **Target File**: `src/context/AuthContext.tsx` (logout() handler)
- **Impact Summary**: Cached scan metadata visible via browser Back button after logout
- **Recommended Action**: Purge sessionStorage, memory cache, and clear indexedDB store on logout.

---

### [SEC-WEB-011] Active Console Debug Statements in Build Assets
- **Severity**: `Low`
- **Category**: Code Quality
- **Target File**: `src/App.tsx` (console.log statements)
- **Impact Summary**: Exposes internal object structures in developer tools console
- **Recommended Action**: Configure Vite esbuild drop: ["console", "debugger"] in vite.config.ts.

---

### [SEC-WEB-012] Unpinned Caret Versions in Frontend Dependencies
- **Severity**: `Low`
- **Category**: Dependency Management
- **Target File**: `package.json` (dependencies block)
- **Impact Summary**: Minor dependency updates might introduce supply-chain changes
- **Recommended Action**: Pin exact package versions and commit package-lock.json.

---

### [SEC-WEB-013] Missing Permissions-Policy Meta Directives
- **Severity**: `Low`
- **Category**: Browser Hardening
- **Target File**: `index.html` (<head> element)
- **Impact Summary**: Geolocation and microphone APIs accessible by embedded frames
- **Recommended Action**: Define restrictive Permissions-Policy header (geolocation=(), camera=()).

---

### [SEC-WEB-014] Cross-Origin Opener Policy (COOP) Missing
- **Severity**: `Low`
- **Category**: Process Isolation
- **Target File**: `index.html` (<head> element)
- **Impact Summary**: No cross-origin process isolation for top-level window
- **Recommended Action**: Set Cross-Origin-Opener-Policy: same-origin.


---
*Report generated automatically by BillScan Tracker Web Security Suite.*
