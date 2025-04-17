# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please report it responsibly**. Contact the maintainer David Ruzicka directly at:

- **Email:** [davidruzicka@post.cz](mailto:davidruzicka@post.cz)

Do not open a public issue for security matters. Instead, provide a clear description of the issue and, if possible, steps to reproduce it. You will receive a response as soon as possible.

---

## Known Security Issues in Dependencies

This project may depend on packages that have known vulnerabilities reported by automated tools (e.g., npm audit, GitHub Dependabot). After careful review, the following issues are currently **ignored** because they are not relevant for this project's use-case:

- Vulnerabilities in development dependencies (e.g., `gulp`, `eslint`, `prettier`, `gulp-cli`, `glob-watcher`, `chokidar`, `braces`, `micromatch`, `findup-sync`, `matchdep`, `liftoff`, `readdirp`) – these packages are not included in the production build and do not affect the security of the deployed package.
- Vulnerabilities in transition packages (e.g., `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`) – these are only used in development and are not included in production.
- Vulnerabilities in dependencies such as `axios` (via `@n8n/client-oauth2`) or `n8n-core` – these packages are used as part of the n8n ecosystem and are not directly used in this project.

**Why these vulnerabilities are not relevant:**
- The above-mentioned packages are not bundled with the final package used in n8n production workflows.
- All listed vulnerabilities only affect the development environment or scenarios not applicable to this project.

If you have concerns about any dependency, please contact the maintainer for clarification.

---

_Last updated: 2025-04-17_
