#!/usr/bin/env tsx
/**
 * pre-prod.ts — Validation avant déploiement / push
 * Lance: lint + typecheck
 * Le build complet (next build) est géré par Vercel en CI.
 */

import { execSync } from "child_process";

const steps: { name: string; cmd: string }[] = [
  { name: "Lint", cmd: "npm run lint" },
  { name: "Typecheck", cmd: "npx tsc --noEmit" },
];

let failed = false;

for (const step of steps) {
  console.log(`\n▶ ${step.name}...`);
  try {
    execSync(step.cmd, { stdio: "inherit" });
    console.log(`✅ ${step.name} OK`);
  } catch {
    console.error(`❌ ${step.name} a échoué`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error("\n🚫 Validation échouée — push annulé.");
  process.exit(1);
} else {
  console.log("\n✅ Doussel Immo est prêt pour la Prod");
  process.exit(0);
}
