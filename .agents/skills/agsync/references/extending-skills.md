# Extending Skills

There are two ways to extend skills: via `source` with local instructions, or via the `extends` field.

## Extending an Imported Skill (source + local instructions)

Add instructions below the frontmatter to extend a sourced skill. Your instructions are appended after the remote skill's instructions:

```markdown
<!-- .agsync/skills/code-reviewer/SKILL.md -->
---
name: code-reviewer
description: Security-focused code reviewer for our team.
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
tools:
  - github
---

Additionally, focus on OWASP Top 10 vulnerabilities.
Flag any hardcoded secrets or credentials.
```

- **No body**: pure import, everything comes from the source
- **With body**: extension, your content is appended after the remote content

## Extending via `extends` (local and remote inheritance)

Skills can inherit from other skills using the `extends` frontmatter field:

```markdown
<!-- .agsync/skills/security-reviewer/SKILL.md -->
---
name: security-reviewer
description: Security-focused code reviewer. Use for security audits.
extends:
  - ./code-reviewer
  - github:your-org/shared-skills/owasp
---

Focus specifically on OWASP Top 10 vulnerabilities.
```

### Merge Strategy

- **Instructions**: base instructions are concatenated (base first, then extending)
- **Tools**: union-merged (no duplicates)
- **Name/Description**: the extending skill's values take precedence

### Reference Formats

| Format | Resolves to |
|--------|-------------|
| `./base-skill` | Local skill in `.agsync/skills/` |
| `github:org/repo/path` | Fetched from GitHub, cached in `.agsync/cache/` |
