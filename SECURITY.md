# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Active          |

## Reporting a Vulnerability

We take the security of StockFlow seriously. If you believe you've found a
security vulnerability, please report it by emailing the project maintainer.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the repository owner with details of the
issue. You should receive a response within 48 hours.

## What to Include

- Type of issue (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

## Preferred Languages

We prefer all communications to be in English.

## Disclosure Policy

- The vulnerability will be investigated and confirmed
- A fix will be prepared and tested
- The fix will be deployed to production
- A security advisory will be published

## Security Best Practices for Production

- Set a strong `JWT_SECRET` environment variable (at least 32 characters)
- Never commit `.env` files with real secrets to the repository
- Keep dependencies updated
- Use proper database credentials (not the defaults) in production
- Enable CORS to limit origins to your frontend domain only
