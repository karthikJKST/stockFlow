# Security Policy

## Supported Versions

We recommend using the latest release of StockFlow. Security updates are provided for the current major version.

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active development |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in StockFlow, please report it privately before disclosing it publicly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities.
2. Email the details to the project maintainer, or
3. Open a **draft security advisory** on GitHub:
   - Go to [github.com/karthikJKST/stockFlow/security/advisories](https://github.com/karthikJKST/stockFlow/security/advisories)
   - Click **"New draft security advisory"**
   - Fill in the details (severity, affected versions, description, steps to reproduce)

### What to Include

- A clear description of the vulnerability
- Steps to reproduce (PoC, screenshots, or code snippets)
- Affected versions
- Potential impact
- Any suggested fixes (if known)

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| 48 hours  | Initial acknowledgment of your report |
| 7 days    | Assessment and confirmation of the vulnerability |
| 30 days   | Fix released (depending on severity) |

We will keep you informed throughout the process and credit you in the release notes if you'd like.

## Security Best Practices for Deployment

### JWT Secret

**⚠️ Always override the default JWT secret in production.**

The `application.yml` contains a development-only default:
```yaml
jwt:
  secret: ${JWT_SECRET:StockFlowDevSecret2026SuperSecretKeyForJWT}
```

Set the `JWT_SECRET` environment variable to a strong, unique value (at least 32 characters) before deploying.

### Database Credentials

The default PostgreSQL password (`stockflow`) in `docker-compose.yml` is for local development only. Change it before any public-facing deployment.

### Environment Variables

Never commit real secrets to the repository. Use `.env` files locally (already gitignored) and set environment variables in your deployment environment.

### Finnhub API Key

If you integrate with Finnhub for live market data:
- Store the API key in the `FINNHUB_API_KEY` environment variable
- The project runs fine without it using simulated data

## Known Security Considerations

- **Authentication**: JWT tokens are used for API auth. Tokens expire after 24 hours by default.
- **Password Storage**: Passwords are hashed using BCrypt via Spring Security.
- **Demo Users**: Preloaded accounts (`demo`, `alice`, `bob`) exist in development mode. These should be removed or the database re-seeded for production use.
- **H2 Console**: The H2 database console is enabled in dev mode (`/h2-console`). Disable it in production by removing the `spring.h2.console.enabled` property.

## Dependency Scanning

We use **Dependabot** and **GitHub Actions** to automatically scan dependencies for known vulnerabilities:

- Dependabot checks Maven and npm dependencies weekly
- CI pipeline runs on every push and PR to `main`
- Docker images are built with cache layers for faster security updates

## Disclosure Policy

- We will acknowledge receipt of vulnerability reports within 48 hours.
- We will provide an estimated timeline for a fix.
- We will notify you when the vulnerability is fixed.
- We will publicly credit you for the discovery (unless you prefer to remain anonymous).
