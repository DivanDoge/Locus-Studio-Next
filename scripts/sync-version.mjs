import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

const packageJsonPath = path.join(rootDir, "package.json");
const packageLockPath = path.join(rootDir, "package-lock.json");
const cargoTomlPath = path.join(rootDir, "src-tauri", "Cargo.toml");
const tauriConfigPath = path.join(rootDir, "src-tauri", "tauri.conf.json");

const packageJson = readJson(packageJsonPath);
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Unsupported version format in package.json: ${version}`);
}

const packageLock = readJson(packageLockPath);
packageLock.version = version;
if (packageLock.packages && packageLock.packages[""]) {
  packageLock.packages[""].version = version;
}
writeText(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);

const cargoToml = fs.readFileSync(cargoTomlPath, "utf8");
const cargoVersionMatch = cargoToml.match(/(^\[package\][\s\S]*?^version\s*=\s*")([^"]+)("\s*$)/m);
if (!cargoVersionMatch) {
  throw new Error("Could not update [package].version in src-tauri/Cargo.toml");
}
const [, prefix, currentCargoVersion, suffix] = cargoVersionMatch;
const nextCargoToml =
  currentCargoVersion === version
    ? cargoToml
    : cargoToml.replace(cargoVersionMatch[0], `${prefix}${version}${suffix}`);
writeText(cargoTomlPath, nextCargoToml);

const tauriConfig = readJson(tauriConfigPath);
tauriConfig.version = version;
writeText(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);

console.log(`Synced version ${version} to package-lock.json, Cargo.toml, and tauri.conf.json`);
