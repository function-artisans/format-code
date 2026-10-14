#!/usr/bin/env node

import { parseArgs } from "node:util";
import { format as prettierFormat } from "prettier";
import { format as sqlFormat, SqlLanguage, supportedDialects } from "sql-formatter";
import {
  isLanguage,
  isSqlLanguage,
  Language,
  languages,
  parsePrintWidth,
  prettierParsers,
} from "./options.js";

function formatSQL(input: string, sqlDialect: SqlLanguage): string {
  return sqlFormat(input, {
    language: sqlDialect,
    functionCase: "upper",
    dataTypeCase: "lower",
    keywordCase: "upper",
  });
}

function wrapWithCodeblock(code: string, lang?: string) {
  return ["```", lang ? ` ${lang}` : "", "\n", code, "\n", "```"].join("");
}

function hasContent(s?: string) {
  return s && s.trim().length > 0;
}

const dividers = [/\n(?=[┌╔])/, /(?<=;)\n/];

function splitInput(input: string): [string, string] | undefined {
  for (const divider of dividers) {
    const [sql, output] = input.split(divider, 2);
    if (hasContent(sql) && hasContent(output)) return [sql, output];
  }
}

type FormatOptions = {
  language: Language;
  input: string;
  printWidth?: number;
  sqlDialect?: SqlLanguage;
};

function format({ language, input, printWidth, sqlDialect = "sql" }: FormatOptions): string {
  if (language === "sql") {
    return formatSQL(input, sqlDialect);
  }

  if (language === "sql-output") {
    const parts = splitInput(input);

    if (!parts) {
      throw new Error("Invalid input: could not split SQL from output");
    }

    const [sql, result] = parts;
    const formattedSQL = formatSQL(sql.trim(), sqlDialect);

    return [wrapWithCodeblock(formattedSQL), wrapWithCodeblock(result.trim())].join("\n");
  }

  const parser = prettierParsers[language];
  return prettierFormat(input, { parser, printWidth });
}

async function readStdin(): Promise<string> {
  const chunks: string[] = [];
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) chunks.push(chunk);
  return chunks.join("");
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function checkPrintWidth(value: string): number {
  const printWidth = parsePrintWidth(value);

  if (printWidth === undefined) {
    fail(`Invalid print width: ${value}\nPrint width must be a positive integer`);
  }

  return printWidth;
}

function checkSqlDialect(value: string): SqlLanguage {
  if (!isSqlLanguage(value)) {
    fail(`Unknown SQL dialect: ${value}\nSQL dialects: ${supportedDialects.join(", ")}`);
  }

  return value;
}

function checkLanguage(value: string): Language {
  if (!isLanguage(value)) {
    fail(`Unknown language: ${value}\nLanguages: ${languages.join(", ")}`);
  }

  return value;
}

const usage = `Usage:
  format-code <language> [options] < input

Format the code from stdin and write the result to stdout.

Languages:
  ${languages.join(", ")}

Options:
  --print-width N     Prettier print width (default: 100)
  --sql-dialect NAME  SQL dialect (default: sql)
  -h, --help          Show this help

SQL dialects:
  ${supportedDialects.join(", ")}`;

type CommandValues = {
  "print-width"?: string;
  "sql-dialect"?: string;
};

async function runFormat(language: Language, values: CommandValues) {
  const printWidth = checkPrintWidth(values["print-width"] ?? "100");
  const sqlDialect = checkSqlDialect(values["sql-dialect"] ?? "sql");
  const input = await readStdin();

  process.stdout.write(format({ language, input, printWidth, sqlDialect }));
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "print-width": { type: "string" },
      "sql-dialect": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const [command, ...rest] = positionals;

  if (values.help) {
    console.log(usage);
    return;
  }

  if (command === undefined) {
    fail(usage);
  }

  if (rest.length > 0) {
    fail(`Unexpected argument: ${rest[0]}`);
  }

  await runFormat(checkLanguage(command), values);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
