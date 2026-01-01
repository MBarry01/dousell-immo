/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require("dotenv");
const { resolve } = require("path");

config({ path: resolve(process.cwd(), ".env.local") });

console.log("NEXT_PUBLIC_TURNSTILE_SITE_KEY:", process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "DEFINED" : "MISSING");
