export const EXAMPLE_JSON = `{
  "atlas": "1.0",
  "type": "agent",
  "name": "Code Reviewer",
  "version": "1.0.0",
  "description": "An agent that reviews PRs",
  "agent": {
    "name": "Code Reviewer",
    "description": "Reviews pull requests",
    "personality": "Thorough and constructive",
    "provider": { "type": "openai", "model": "gpt-4o" }
  },
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
}`;
