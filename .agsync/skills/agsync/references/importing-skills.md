# Importing Skills from Open Source

Import skills from any GitHub repo that follows the Agent Skills standard.

## Import a Skill

```bash
agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer
```

This creates a SKILL.md stub with the source reference:

```markdown
<!-- .agsync/skills/code-reviewer/SKILL.md (created by skill add) -->
---
name: code-reviewer
description: Reviews code for quality, security, and performance.
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
---
```

No instructions or supporting files are downloaded yet.

## Sync Fetches the Content

When you run `agsync sync`, skills with a `source` field are resolved:

1. The remote SKILL.md is fetched and its instructions are used
2. Supporting files (scripts/, references/, assets/) are downloaded into the local skill directory
3. Agent configs are generated from the resolved content

```bash
agsync sync
```

## Source Fields

| Field | Description |
|-------|-------------|
| registry | Always `github` |
| org | GitHub organization or user |
| repo | Repository name |
| path | Path to the skill directory within the repo |
