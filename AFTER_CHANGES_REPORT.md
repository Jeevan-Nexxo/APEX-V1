# APEX V1 — AFTER-CHANGES REPORT

Date: 2026-09-03 | Scope: Client showcase readiness (deadline 19 Sept 2026)

## Verdict: READY WITH BLOCKERS

The platform is code-complete, DB-migrated, and production-buildable. Two environment
items remain before a guaranteed live launch: SMTP credentials and domain purchase.

---

## What was implemented in this pass

### Registration & OTP (Student + Visitor)
- Rewrote `VisitorRegisterForm.jsx` to a 3-step flow mirroring the student form:
  Step 1 general details + identity proof (350 KB, PDF/JPG/PNG), Step 2 credentials
  with show/hide toggles + client-side password policy, Step 3 redirect to OTP entry.
- `VerifyEmail.jsx` rewritten to the OTP flow: reads `?email=`, 6-digit code input,
  resend-OTP with 60s countdown, success/error states.
- Added `resendOtp()` to `authServices.js` and wired it to `/auth/resend-otp`.
- Added show/hide password toggles to `LoginForm.jsx` and `ResetPassword.jsx`.
- Initialized `formData` in `StudentRegisterForm.jsx`.

### Schema / Database
- **Critical fix:** migration `23_fix_schema_issues.sql` originally tried to cast
  child `project_id` columns from UUID→INTEGER based on a wrong assumption from the
  committed schema files. The live DB uses UUID for `projects.id`. Rewrote migration 23
  to drop the broken casts and only apply safe/idempotent fixes (dedup the
  `project_reviews` ON DELETE constraint to a single SET NULL, `reviewed_at` guard,
  blacklist index, updated_at triggers).
- Verified both `23` and `24` apply cleanly against the live DB (`ON_ERROR_STOP`).
- Confirmed server auto-applies all 24 schema files on startup with no errors.
- Fixed a real latent bug: `project_reviews.reviewer_user_id` had duplicate conflicting
  FKs (CASCADE + SET NULL); now a single SET NULL constraint.

### Home "Explore by category" redesign (Phase 8)
- `CategoryCard.jsx`: dynamic `icon_path` image (fallback folder icon), centered
  layout, project-count pill, hover lift + focus ring, navigates to
  `/projects?category=<slug>`.
- `Categories.jsx`: dynamic counts, responsive 1/2/3/4/5-col grid, `icon_url` passed.
- Confirmed backend `/project/search` filters by category slug — consistent with cards.

### Verified end-to-end wiring (code review)
- Registration → OTP (server stores 6-digit in `email_verifications.verification_token`,
  resend works, verify sets `email_verified`).
- Contact requests are in-app only (DB record + in-app notification), no email — matches
  the design constraint.
- Login blocks unverified accounts with a clear message.

---

## Build / runtime verification
- Client `npm run build`: PASS (vite, ~1.1 s).
- Server module loads + `server.js` boot: PASS — "PostgreSQL Connected",
  "Schema auto-applied (24 files)", server listens on :5000.
- Migration apply (23 + 24): PASS with `ON_ERROR_STOP=1`.

---

## Remaining blockers
1. **SMTP email delivery** — `SMTP_USER`/`SMTP_PASS` in `server/.env` are empty.
   OTP, password-reset, and project-status emails will NOT send until a Gmail app
   password is configured. Code has a safe fallback (logs instead of crash), so the
   app runs, but email-based flows can't complete for real users.
2. **Domain purchase** — affects email sender address / deployed URLs / social preview.
   `client/index.html` currently uses placeholder `https://apex.example.com` and
   `favicon.svg` (the committed `public/logo/logo.png` is 0 bytes).

## Recommended next actions
1. Add Gmail app password to `server/.env`; run a live OTP email test.
2. Buy the domain; update social preview URLs and SMTP `SMTP_FROM`.
3. Replace the empty `public/logo/logo.png` with the real logo.
4. Final QA pass: full registration→OTP→login→project-create→review→public-visibility
   flow, plus query 5/day and one-reply rule and file-limit (1MB/3-file) checks.