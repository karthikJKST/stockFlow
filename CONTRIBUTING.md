# Contributing to StockFlow

Thank you for considering contributing to StockFlow! 🎉

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### 1. Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/karthikJKST/stockFlow/issues).
- If not, open a new issue with a clear title and description.
- Include steps to reproduce, expected behavior, and actual behavior.
- Add screenshots or logs if applicable.

### 2. Suggesting Features

- Open an issue describing the feature, why it's useful, and how it should work.
- Use the "Feature Request" label.

### 3. Submitting Code Changes

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the project conventions:
   - Backend: Java 21, Spring Boot conventions, 4-space indentation
   - Frontend: TypeScript, React 18, 2-space indentation
4. **Run validation**:
   ```bash
   # Backend
   cd backend && mvn compile

   # Frontend
   cd frontend && npx tsc --noEmit && npm run build
   ```
5. **Commit** with a clear message:
   ```
   feat: add support for X
   fix: resolve issue with Y
   docs: update README
   ```
6. **Push**: `git push origin feature/your-feature-name`
7. **Open a Pull Request** targeting the `main` branch

### 4. Pull Request Guidelines

- Keep PRs focused — one feature/fix per PR.
- Update the README or docs if your changes affect usage.
- Ensure all CI checks pass before requesting review.
- Reference any related issues in the PR description.

## Development Setup

See the [README](README.md#quick-start) for detailed setup instructions.

## Project Structure

```
StockFlow/
├── backend/          # Spring Boot 3.4 + Java 21
│   ├── src/
│   └── pom.xml
├── frontend/         # React 18 + TypeScript + Vite
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── .github/workflows/  # CI pipeline
```

## Style Guide

- **Java**: Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- **TypeScript/React**: Follow project conventions — see existing components for reference
- **CSS**: Use CSS custom properties defined in `:root`; prefer class-based styling
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
