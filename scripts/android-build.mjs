#!/usr/bin/env node
/**
 * Runs Gradle for the Android project using JDK 21+ (required by Capacitor 8).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = join(root, "android");
const variant = process.argv[2] === "release" ? "assembleRelease" : "assembleDebug";

const jdkCandidates = [
  process.env.JAVA_HOME,
  "C:\\Program Files\\Android\\Android Studio\\jbr",
  join(process.env.LOCALAPPDATA ?? "", "Programs", "Android", "Android Studio", "jbr"),
  "C:\\Program Files\\Java\\jdk-21",
  "C:\\Program Files\\Eclipse Adoptium\\jdk-21",
].filter(Boolean);

const javaHome = jdkCandidates.find((dir) => existsSync(join(dir, "bin", "java.exe")));

if (!javaHome) {
  console.error(
    "JDK 21+ not found. Install Android Studio or JDK 21, then set JAVA_HOME.",
  );
  process.exit(1);
}

const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const env = { ...process.env, JAVA_HOME: javaHome };

console.log(`Using JAVA_HOME=${javaHome}`);
const result = spawnSync(gradle, [variant], {
  cwd: androidDir,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
