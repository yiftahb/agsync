# Extending Skills

There are two ways to extend skills: via `source` with local `instructions`, or via the `extends` field.

## Extending an Imported Skill (source + instructions)

Add `instructions` to a sourced skill. Your instructions are appended after the remote skill's instructions:

```yaml
# .agsync/skills/code-reviewer/code-reviewer.yaml
name: code-reviewer
description: >
  Security-focused code reviewer for our team.
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
instructions: |
  Additionally, focus on OWASP Top 10 vulnerabilities.
  Flag any hardcoded secrets or credentials.
tools:
  - github
```

- **No `instructions`**: pure import, everything comes from the source
- **With `instructions`**: extension, your content is appended after the remote content

## Extending via `extends` (local and remote inheritance)

Skills can inherit from other skills using the `extends` field:

```yaml
# .agsync/skills/security-reviewer/security-reviewer.yaml
name: security-reviewer
description: >
  Security-focused code reviewer. Use for security audits.
extends:
  - ./code-reviewer                        # Local skill in .agsync/skills/
  - github:your-org/shared-skills/owasp    # Fetched from GitHub, cached locally
instructions: |
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
