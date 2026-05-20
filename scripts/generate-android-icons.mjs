#!/usr/bin/env node
/**
 * Generates Android launcher icons and splash from public/ assets.
 */
import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconSource = join(root, "public", "wow wp icon.png");
const splashSource = join(root, "public", "splash screen.png");
const resDir = join(root, "android", "app", "src", "main", "res");

/** Legacy launcher icon sizes (px). */
const LAUNCHER_SIZES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

/** Adaptive icon foreground sizes (px). */
const FOREGROUND_SIZES = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

const SPLASH_WIDTH = 1080;
const SPLASH_HEIGHT = 1920;

async function writePng(buffer, dir, name, size) {
  const folder = join(resDir, dir);
  await mkdir(folder, { recursive: true });
  const out = join(folder, name);
  await sharp(buffer)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(out);
}

async function writeSplash() {
  const splashDir = join(resDir, "drawable");
  await mkdir(splashDir, { recursive: true });
  const splashOut = join(splashDir, "splash.png");

  await sharp(splashSource)
    .resize(SPLASH_WIDTH, SPLASH_HEIGHT, { fit: "cover", position: "centre" })
    .png()
    .toFile(splashOut);

  const portraitDirs = [
    "drawable-port-mdpi",
    "drawable-port-hdpi",
    "drawable-port-xhdpi",
    "drawable-port-xxhdpi",
    "drawable-port-xxxhdpi",
  ];

  for (const dir of portraitDirs) {
    const folder = join(resDir, dir);
    await mkdir(folder, { recursive: true });
    await copyFile(splashOut, join(folder, "splash.png"));
  }
}

async function main() {
  const input = sharp(iconSource).ensureAlpha();

  for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
    const buf = await input.clone().toBuffer();
    await writePng(buf, folder, "ic_launcher.png", size);
    await writePng(buf, folder, "ic_launcher_round.png", size);
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const buf = await input.clone().toBuffer();
    await writePng(buf, folder, "ic_launcher_foreground.png", size);
  }

  await writeSplash();

  console.log("Android icons generated from", iconSource);
  console.log("Android splash generated from", splashSource);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
