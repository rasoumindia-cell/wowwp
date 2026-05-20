#!/usr/bin/env node
/**
 * Builds mobile-shell/index.html from the template, injecting
 * CAPACITOR_SERVER_URL when set at build time.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, "mobile-shell", "index.html.template");
const indexPath = join(root, "mobile-shell", "index.html");
const defaultServer = process.env.CAPACITOR_SERVER_URL?.replace(/\/$/, "") ?? "";

const html = readFileSync(templatePath, "utf8").replace(
  "__WACRM_DEFAULT_SERVER__",
  defaultServer.replace(/\\/g, "\\\\").replace(/"/g, '\\"'),
);
writeFileSync(indexPath, html);
