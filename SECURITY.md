# Security Policy

## Supported Versions

Atlas is currently in early development. Security fixes are applied to the latest version only.

| Version | Supported |
|---------|-----------|
| latest (main) | ✓ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it privately:

- **Email**: open a [GitHub Security Advisory](https://github.com/AviranLevi/atlas/security/advisories/new) (preferred)
- Or email directly at the address on the GitHub profile

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any suggested mitigations if you have them

You can expect an acknowledgement within 48 hours and a resolution timeline within 7 days for confirmed issues.

## Scope

Atlas is a **local-first tool** intended to run on your own machine. By default:

- The server binds to `localhost` only
- No authentication is required (single-user assumption)
- CORS is wide open for local development convenience

**Do not expose Atlas to the public internet without adding authentication and restricting CORS.** The README's security note covers this, but it bears repeating here.

## Out of Scope

- Vulnerabilities that require physical access to the machine running Atlas
- Issues in third-party agent CLIs (Claude Code, Aider, etc.) — report those to their respective projects
- Self-XSS or issues that require the attacker to already have local machine access
