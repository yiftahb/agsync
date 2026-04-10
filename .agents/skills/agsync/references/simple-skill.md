# Simple Skill

A minimal skill with just name, description, and instructions.

## Directory Structure

```
.agsync/skills/testing-standards/
└── testing-standards.yaml
```

## Skill Definition

```yaml
# .agsync/skills/testing-standards/testing-standards.yaml
name: testing-standards
description: >
  Enforces testing standards. Use when writing or reviewing tests.
instructions: |
  Always write tests using the project's test framework.
  Ensure >80% coverage on new code.
  Use descriptive test names that explain the expected behavior.
```

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Must match the directory name |
| description | Yes | What the skill does and when to use it |
| instructions | Yes (unless `source` is present) | Detailed instructions for the agent (markdown) |
| tools | No | List of tool names this skill can use |
