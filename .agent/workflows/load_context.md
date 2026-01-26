
---
description: Refresh and load AI context (rules and Supabase brain)
---

This workflow updates the component map and displays the relevant AI context files. Use this before starting implementation tasks to ensure you have the latest view of the codebase components.

1. Generate the latest project brain (Data + UI)
// turbo
npm run brain

2. Read the system rules
// turbo
type .cursorrules

3. Read the project brain
// turbo
type PROJECT_BRAIN.md

4. Read the component index
// turbo
type components/ui/index.ts
