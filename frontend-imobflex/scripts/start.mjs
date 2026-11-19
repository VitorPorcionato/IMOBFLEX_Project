import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd();
for (const [source, destination] of [
  ["public", ".next/standalone/public"],
  [".next/static", ".next/standalone/.next/static"],
])
  fs.cpSync(path.join(root, source), path.join(root, destination), {
    recursive: true,
  });
process.env.HOSTNAME ||= "127.0.0.1";
await import(pathToFileURL(path.join(root, ".next/standalone/server.js")).href);
