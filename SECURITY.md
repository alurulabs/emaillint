# Security Policy

## Supported versions

EmailLint is **pre-stable**. Security fixes land on `main` only - there
are no backport branches yet.

| Version | Supported |
|---------|-----------|
| latest release (`main`) | ✅ |
| older releases | ❌ |

## Reporting a vulnerability

**Do not open a public issue for a suspected vulnerability.** Use GitHub's
private vulnerability reporting instead:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the affected component (`packages/core`, `packages/cli`,
   or the GitHub Action), and a reproducible example or proof of concept.

Reports are private and visible only to maintainers. You'll get an initial
acknowledgement within a few days. If the report is accepted, we'll coordinate
a fix and disclosure timeline with you. Please do not disclose the issue
publicly until a fix is released.

## Scope

EmailLint is a **static analysis engine** - it parses HTML/CSS and reports
issues. It makes **no network requests** and runs fully offline.

In scope:

- Anything that lets an untrusted HTML email compromise the machine running
  EmailLint (parser or tooling bug enabling code execution, path traversal,
  ReDoS that can be triggered by a crafted email).
- Weaknesses in the GitHub Action's setup (shell injection, secret exposure).

Out of scope - report these as **regular issues**, not security reports:

- A rule that flags the wrong thing, or fails to flag something (a false
  positive / false negative). These are correctness bugs, not security issues.
- Compatibility data that disagrees with a real email client.
- Anything in an environment where EmailLint is already run on trusted input.
