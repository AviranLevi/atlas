export const EXAMPLE_JSON = `{
  "schemaVersion": "1.0",
  "type": "agent",
  "metadata": {
    "name": "Code Reviewer",
    "description": "An agent that reviews PRs",
    "version": "1.0.0",
    "author": "Atlas",
    "tags": ["review", "code-quality"]
  },
  "content": {
    "name": "Code Reviewer",
    "description": "Reviews pull requests",
    "personality": "Thorough and constructive",
    "skills": [{
      "name": "PR Review",
      "type": "Review",
      "steps": "1. Read the diff\\n2. Check for issues"
    }],
    "rules": [{
      "name": "Code Style",
      "type": "Backend",
      "tags": ["style"],
      "content": "Use camelCase for variables"
    }]
  }
}`;
