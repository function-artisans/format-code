import { execFile, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { promisify } from "node:util";
import { displayNames, Language } from "./options.js";

const execFileAsync = promisify(execFile);

type CommandOptions = {
  bin: string;
  printWidth?: number;
  sqlDialect?: string;
};

export type ShortcutsOptions = CommandOptions & {
  languages: Language[];
  outDir: string;
};

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shellCommand(language: Language, { bin, printWidth, sqlDialect }: CommandOptions): string {
  const parts = ["pbpaste", "|", bin, language];

  if (printWidth !== undefined) parts.push(`--print-width=${printWidth}`);
  if (sqlDialect && language.startsWith("sql")) parts.push(`--sql-dialect=${sqlDialect}`);

  // Shortcuts turns a script result that looks like JSON into a dictionary and loses the format.
  parts.push("|", "pbcopy");

  return parts.join(" ");
}

function shortcutPlist(name: string, command: string): string {
  const scriptUUID = randomUUID().toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>WFWorkflowName</key>
  <string>${escapeXml(name)}</string>
  <key>WFWorkflowClientVersion</key>
  <string>2607.0.2</string>
  <key>WFWorkflowMinimumClientVersion</key>
  <integer>900</integer>
  <key>WFWorkflowMinimumClientVersionString</key>
  <string>900</string>
  <key>WFWorkflowIcon</key>
  <dict>
    <key>WFWorkflowIconStartColor</key>
    <integer>463140863</integer>
    <key>WFWorkflowIconGlyphNumber</key>
    <integer>59446</integer>
  </dict>
  <key>WFWorkflowTypes</key>
  <array>
    <string>WFWorkflowTypeShowInSearch</string>
  </array>
  <key>WFWorkflowInputContentItemClasses</key>
  <array/>
  <key>WFWorkflowImportQuestions</key>
  <array/>
  <key>WFWorkflowActions</key>
  <array>
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.runshellscript</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>Script</key>
        <string>${escapeXml(command)}</string>
        <key>Shell</key>
        <string>/bin/bash</string>
        <key>UUID</key>
        <string>${scriptUUID}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>
`;
}

// Shortcuts runs the script with a small PATH, so the shortcut needs the full path.
export function findBin(): string | undefined {
  try {
    return execFileSync("which", ["format-code"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

const signAttempts = 3;
const retryDelayMs = 2000;

// The "shortcuts sign" command sends the shortcut to Apple. Apple sometimes returns a server error.
async function signShortcut(unsignedPath: string, signedPath: string): Promise<void> {
  const signArgs = ["sign", "--mode", "anyone", "--input", unsignedPath, "--output", signedPath];

  for (let attempt = 1; ; attempt++) {
    try {
      await execFileAsync("shortcuts", signArgs);
      return;
    } catch (e) {
      const stderr = (e as { stderr?: string }).stderr?.trim();

      if (attempt === signAttempts) {
        throw new Error(`Cannot sign ${signedPath}: ${stderr || e}`, { cause: e });
      }

      console.error(`Cannot sign ${signedPath}: ${stderr || e}. Try again in ${retryDelayMs / 1000} s.`);
      await setTimeout(retryDelayMs);
    }
  }
}

// Signing takes a few seconds for each shortcut, so give each path as soon as it is signed.
export async function* generateShortcuts({
  languages,
  outDir,
  ...commandOptions
}: ShortcutsOptions): AsyncGenerator<string> {
  const workDir = mkdtempSync(join(tmpdir(), "format-code-shortcuts-"));

  mkdirSync(outDir, { recursive: true });

  try {
    for (const language of languages) {
      const name = `Format ${displayNames[language]}`;
      // The "shortcuts sign" command accepts only an input file with the .shortcut extension.
      const unsignedPath = join(workDir, `${language}.shortcut`);
      const signedPath = join(outDir, `${name}.shortcut`);

      writeFileSync(unsignedPath, shortcutPlist(name, shellCommand(language, commandOptions)));
      await signShortcut(unsignedPath, signedPath);
      yield signedPath;
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
