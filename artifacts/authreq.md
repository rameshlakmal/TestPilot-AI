# Authentication Requirements (Login + Registration)

## 1. Purpose
Define detailed requirements for implementing user Registration and Login for a web application (and reusable backend service) with strong security, good UX, and clear acceptance criteria.

## 2. Scope
In scope:
- Email/password registration
- Email verification
- Login (email + password)
- Session management (web)
- Logout
- Forgot password / reset password
- Account lockouts, rate limiting, and abuse protections
- Basic account profile fields needed for auth (name, email, status)
- Audit logging and operational observability for auth events

Optional (include if product chooses to enable):
- MFA (TOTP + recovery codes)
- Social login (Google / Microsoft / GitHub)
- Passwordless login (magic link)

Out of scope (unless explicitly added later):
- Authorization policy beyond a simple `role` claim (RBAC/ABAC)
- Full user profile management (address book, preferences, etc.)
- SSO/SAML
- Payments / billing

## 3. Goals
- Secure by default, aligned with OWASP ASVS concepts.
- Minimal friction: clear errors, fast flows, accessible UI.
- Predictable API behavior with stable error codes.
- Operationally safe: rate limits, lockouts, auditing, monitoring.

## 4. Non-Goals
- Do not attempt to "hide" whether an account exists via confusing UI; instead, prevent enumeration through uniform responses, rate limiting, and email-channel confirmations.
- Do not implement custom crypto. Use vetted libraries.

## 5. Assumptions
- The product is a typical multi-user web app.
- Users authenticate via browser; mobile can reuse API.
- Emails can be sent via a transactional email provider.
- HTTPS is enforced; HSTS is enabled.

## 6. Definitions
- User: An end-user with an account.
- Verified email: Email ownership confirmed via verification link.
- Session: Server-side session or token-based session representing a logged-in browser.
- Refresh token: Long-lived secret used to obtain new access tokens.
- Access token: Short-lived bearer token used to call APIs.
- MFA: Multi-factor authentication (something you know + something you have).

## 7. User Personas
- New user: registers, verifies email, logs in.
- Returning user: logs in, may reset password, may enable MFA.
- Support/admin: needs audit visibility and ability to disable accounts.

## 8. User Stories
1. As a new user, I can create an account using my email and a password.
2. As a new user, I receive an email verification link and can verify my email.
3. As a returning user, I can log in with my email and password.
4. As a user, I can log out from this browser.
5. As a user, if I forget my password, I can request a reset link and set a new password.
6. As a user, I am protected from account compromise with lockouts and rate limiting.
7. (Optional) As a user, I can enable MFA for extra security.

## 9. Functional Requirements

### 9.1 Registration
Requirements:
- UI collects:
  - Email (required)
  - Password (required)
  - Display name (optional; may be required depending on product)
  - Acceptance of Terms/Privacy (required if applicable)
- Email normalization:
  - Trim whitespace.
  - Lowercase the domain part; local-part handling should be consistent and documented.
- Email uniqueness:
  - Enforce uniqueness case-insensitively.
  - If the email already exists, return a generic message to avoid easy enumeration (see Security).
- Password policy (default):
  - Minimum length: 12 characters.
  - Maximum length: 72 characters (bcrypt) or higher if using argon2id; document limit.
  - Must not be on a common password list.
  - Must not contain the email address as a substring (case-insensitive).
  - Allow all printable ASCII characters; do not restrict to "letters+digits".
- Password storage:
  - Hash using `argon2id` (preferred) or `bcrypt` with cost tuned for the environment.
  - Store per-user salt as required by the algorithm.
- Account state after registration:
  - Create user in `pending_verification` state.
  - Send verification email with single-use token and expiry.
  - Allow login behavior before verification must be explicitly chosen:
    - Default: allow login but restrict sensitive actions until verified, OR
    - Alternative: block login until email is verified.
  - Document which model is used.
- Idempotency:
  - Submitting the same registration request multiple times should not create multiple accounts.

Acceptance criteria:
- User can submit registration with valid inputs and receives a success screen.
- Verification email is sent (or queued) and contains a working link.
- Duplicate email cannot create a second account.
- Password is never stored or logged in plaintext.

### 9.2 Email Verification
Requirements:
- Verification link contains:
  - Opaque token (random, high entropy)
  - User identifier is optional; do not rely on guessable IDs.
- Token rules:
  - Single-use.
  - Expires in 24 hours (configurable).
  - Stored hashed-at-rest (recommended) to reduce blast radius.
- UX:
  - If token is valid: mark email verified and show confirmation.
  - If token expired/invalid: show an error and provide "resend verification".
- Resend:
  - Limit resend frequency (e.g., 1/min and 5/hour per email + IP).
  - Do not reveal whether the email exists; return a generic success message.

Acceptance criteria:
- Clicking verification link verifies the account.
- Expired token cannot be reused.
- Resend works and is rate limited.

### 9.3 Login
Requirements:
- UI collects:
  - Email
  - Password
- Authentication:
  - Compare provided password to stored hash using constant-time compare via library.
  - On failure, return a generic error message: "Invalid email or password".
- Email verification handling:
  - If verification is required for login, show "Please verify your email" and offer resend.
  - If verification is not required for login, restrict sensitive actions until verified.
- Rate limiting and lockout:
  - Rate limit per IP and per account identifier.
  - Implement progressive delays after repeated failures.
  - Optional account lockout after N failures (e.g., 10) with a cooldown period.
- Session creation:
  - Establish a logged-in session on success.
  - Record device/session metadata.
- Remember me:
  - Optional checkbox that extends session duration.

Acceptance criteria:
- Valid credentials create an authenticated session.
- Invalid credentials do not create a session and do not disclose which field was wrong.
- Excessive failed attempts are throttled.

### 9.4 Session Management
Choose ONE of the following models and implement consistently.

Model A: Server-side sessions (recommended for web)
- Session ID stored in secure cookie.
- Session data stored server-side (DB/Redis).
- Cookie settings:
  - `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if compatible)
  - `Path=/`
  - Set a reasonable `Max-Age` (e.g., 7 days; 30 days with Remember me)
- CSRF:
  - If using cookies for auth, protect state-changing endpoints with CSRF tokens.

Model B: JWT access + refresh tokens
- Access token:
  - Short-lived (e.g., 15 minutes)
  - Sent via `Authorization: Bearer` header.
- Refresh token:
  - Stored in `HttpOnly` secure cookie or secure storage.
  - Rotating refresh tokens; revoke on reuse.

Common requirements:
- Session invalidation:
  - On password change, invalidate all sessions (configurable).
  - On logout, invalidate current session.
- Idle timeout:
  - Optional idle timeout (e.g., 30 minutes) with sliding expiration.
- Concurrent sessions:
  - Allow multiple sessions; optionally limit to N active sessions.

Acceptance criteria:
- Authenticated routes reject unauthenticated requests.
- Cookie/token settings align with the chosen model.
- Logout removes/invalidate session.

### 9.5 Logout
Requirements:
- Provide a logout action in UI.
- Server invalidates current session/refresh token.
- Client clears auth cookies/local state.
- Redirect to logged-out landing page.

Acceptance criteria:
- After logout, protected pages require re-authentication.

### 9.6 Forgot Password (Reset Request)
Requirements:
- UI collects email.
- Response must be generic regardless of whether the account exists.
- Send reset email with token if account exists.
- Rate limit reset requests.

Token rules:
- Single-use.
- Expires in 1 hour (configurable).
- Store token hashed-at-rest (recommended).

Acceptance criteria:
- User receives reset email for existing account.
- Attackers cannot use this flow to reliably enumerate accounts.

### 9.7 Reset Password (Set New Password)
Requirements:
- User opens reset link and sets new password.
- Enforce the same password policy as registration.
- After success:
  - Invalidate all existing sessions.
  - Optionally log the user in automatically (product choice; default: yes for UX).

Acceptance criteria:
- Reset token cannot be reused.
- Old sessions no longer work.

### 9.8 Account Status and Admin Controls
User statuses:
- `active`
- `pending_verification`
- `disabled`
- `locked` (optional, can be derived from lockout metadata)

Admin/support capabilities (minimum):
- Disable/enable account.
- Force password reset (optional).
- View audit trail for auth events.

Acceptance criteria:
- Disabled accounts cannot log in.

### 9.9 Optional: MFA (TOTP)
Requirements:
- Provide enable/disable MFA.
- Setup:
  - Show QR code for TOTP secret.
  - Require verification of a generated code before enabling.
- Recovery codes:
  - Generate 8-12 one-time codes.
  - Display once and allow regeneration (invalidates previous set).
- Login with MFA:
  - After correct password, prompt for TOTP (or recovery code).
- Remember this device:
  - Optional trusted-device cookie with long expiry; revoke on password change.

Acceptance criteria:
- MFA cannot be enabled without confirming a valid code.
- Recovery code works once.

### 9.10 Optional: Social Login
Requirements:
- OAuth 2.0 / OIDC via provider.
- Support account linking by verified email (careful with provider trust).
- If email is not provided or not verified by provider, require additional verification.

Acceptance criteria:
- Social login creates or links accounts safely without takeover.

## 10. UI/UX Requirements
- Pages:
  - `Sign in`
  - `Create account`
  - `Verify email` confirmation
  - `Forgot password`
  - `Reset password`
  - (Optional) `MFA challenge` and `MFA settings`
- Form behavior:
  - Inline validation after blur; final validation on submit.
  - Clear error messages without revealing sensitive details.
  - Disable submit and show loading state during request.
  - Preserve user input on failure (except passwords).
- Accessibility:
  - All inputs have labels.
  - Errors announced via ARIA live region.
  - Keyboard navigable; focus management on errors.
- Localization:
  - All user-facing strings externalized.
- Security UX:
  - Provide "show password" toggle.
  - Offer password manager-friendly attributes (`autocomplete="email"`, `current-password`, `new-password`).

## 11. API Requirements (Suggested)
All endpoints served over HTTPS only. Return JSON.

### 11.1 Endpoints
- `POST /auth/register`
  - Body: `{ email, password, displayName?, acceptTerms? }`
  - Response: `201` generic success.
- `POST /auth/login`
  - Body: `{ email, password, rememberMe? }`
  - Response: `200` with user summary; sets cookie/session or returns tokens.
- `POST /auth/logout`
  - Response: `204`
- `POST /auth/verify-email`
  - Body: `{ token }`
  - Response: `200`
- `POST /auth/resend-verification`
  - Body: `{ email }`
  - Response: `200` generic.
- `POST /auth/forgot-password`
  - Body: `{ email }`
  - Response: `200` generic.
- `POST /auth/reset-password`
  - Body: `{ token, newPassword }`
  - Response: `200`
- `GET /auth/me`
  - Response: `200` `{ id, email, displayName, emailVerified, role }`

Optional MFA:
- `POST /auth/mfa/setup`
- `POST /auth/mfa/confirm`
- `POST /auth/mfa/disable`

### 11.2 Error Format
Use consistent structure:
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "requestId": "..."
  }
}
```

Rules:
- `message` is user-safe.
- `code` is stable for clients.
- Include `requestId` to correlate logs.

### 11.3 Status Codes
- `200` success
- `201` created
- `204` no content
- `400` validation failed
- `401` unauthenticated
- `403` forbidden (e.g., disabled account)
- `409` conflict (only if safe; prefer generic responses where needed)
- `429` rate limited

## 12. Data Model (Minimum)
### 12.1 User
- `id` (UUID)
- `email` (unique, normalized)
- `email_verified_at` (nullable)
- `password_hash`
- `display_name`
- `role` (e.g., `user`, `admin`)
- `status` (`pending_verification|active|disabled`)
- `created_at`, `updated_at`

### 12.2 Verification Tokens
- `id`
- `user_id`
- `token_hash`
- `type` (`email_verification|password_reset`)
- `expires_at`
- `used_at` (nullable)
- `created_at`

### 12.3 Sessions (if server-side)
- `id`
- `user_id`
- `created_at`, `last_seen_at`, `expires_at`
- `ip`, `user_agent` (optional)
- `revoked_at` (nullable)

### 12.4 Login Attempt Tracking (for lockout)
- `key` (email hash or user id)
- `failure_count`
- `first_failure_at`, `last_failure_at`
- `locked_until` (nullable)

## 13. Security Requirements
- Transport:
  - Enforce HTTPS; HSTS enabled.
- Password hashing:
  - Argon2id preferred; define memory/time parameters.
- Secrets:
  - Tokens are random (>= 128 bits entropy) and stored hashed.
  - Never log passwords, reset tokens, verification tokens.
- Enumeration resistance:
  - Registration/login/forgot-password responses should be generic.
  - Apply per-IP and per-identifier rate limits.
- Rate limiting:
  - Login: e.g., 5/min per IP and 10/min per identifier (tune).
  - Register: e.g., 3/min per IP.
  - Resend/forgot: e.g., 1/min per email and 5/hour.
- CSRF:
  - Required if cookies are used for auth on state-changing endpoints.
- XSS/Content Security:
  - Use output encoding, CSP where feasible.
- Session protection:
  - Secure cookies, rotation after privilege change.
- Account takeover defenses:
  - Invalidate sessions on password reset.
  - Notify user by email on password change/reset (recommended).
- Audit logging:
  - Log auth events with timestamp, user id (if known), IP, UA, result.
  - Do not include secrets.

## 14. Privacy and Compliance
- Data minimization: collect only required fields.
- Provide a way to delete user accounts per policy (out of scope to implement here, but must be considered).
- Email templates include company identity and reason for message.
- Retention policy for auth logs (e.g., 90 days) configurable.

## 15. Observability and Operations
- Metrics:
  - Login success/failure rates.
  - Rate limit triggers.
  - Email send/queue failures.
  - Token verification success/failure.
- Tracing:
  - Propagate `requestId` across services.
- Alerts:
  - Spikes in failed logins.
  - Email provider failures.

## 16. Edge Cases
- User registers but never verifies email.
- User tries to verify with expired token.
- Password reset requested multiple times; only latest token valid (recommended).
- User changes email (out of scope) while verification pending.
- Clock skew between services affecting token expiry.
- Unicode emails: if unsupported, explicitly reject with clear message; otherwise define normalization.

## 17. Acceptance Tests (High-Level)
- Register with valid email/password -> pending verification + email sent.
- Verify email with valid token -> account active.
- Verify email with used token -> fails.
- Login success -> session established.
- Login with wrong password -> generic error.
- Login while disabled -> forbidden with safe message.
- Forgot password -> generic success; email sent if account exists.
- Reset password -> sets new password; invalidates sessions.
- Rate limit triggers on repeated login attempts.

## 18. Deliverables
- Frontend pages/components for auth flows.
- Backend endpoints and data model.
- Email templates:
  - Verification email
  - Password reset email
  - (Optional) Security notifications (password changed, new device login)
- Automated tests:
  - Unit tests for validators and token logic
  - Integration tests for full flows
- Runbook snippets for support (how to disable account, view audit logs).
