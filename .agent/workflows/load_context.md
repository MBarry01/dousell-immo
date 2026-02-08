
---
description: Refresh and load AI context (rules and Supabase brain)
---

This workflow updates the component map and displays the relevant AI context files. Use this before starting implementation tasks to ensure you have the latest view of the codebase components AND strategic decisions.

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

5. Read the workflow proposal (architecture & user flows)
// turbo
type docs/WORKFLOW_PROPOSAL.md

6. Read the remaining tasks (implementation status)
// turbo
type docs/REMAINING_TASKS.md

7. Read the Supabase brain (if exists - optional)
// turbo
type .ai/.supabase_brain.md

8. List available skills
// turbo
dir .agent\skills /B

9. Read rental payment skill (critical for Stripe/payment logic)
// turbo
type .agent\skills\rental-payments\SKILL.md
