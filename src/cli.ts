#!/usr/bin/env node

import { defineCommand, runMain } from "citty";
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

const main = defineCommand({
  meta: { description: "Format code from the clipboard" },
  args: {
    language: {
      type: "positional",
      description: `Language to format (${languages.join(", ")})`,
      required: true,
    },
    "print-width": {
      type: "string",
      description: "Prettier print width",
      default: "100",
    },
    "sql-dialect": {
      type: "string",
      description: `SQL dialect (${supportedDialects.join(", ")})`,
      default: "sql",
    },
  },
  async run({ args }) {
    const language = args.language;
    const printWidth = parsePrintWidth(args["print-width"]);
    const sqlDialect = args["sql-dialect"];

    if (!isLanguage(language)) {
      console.error(`Unknown language: ${language}`);
      console.error(`Languages: ${languages.join(", ")}`);
      process.exit(1);
    }

    if (printWidth === undefined) {
      console.error(`Invalid print width: ${args["print-width"]}`);
      console.error("Print width must be a positive integer");
      process.exit(1);
    }

    if (!isSqlLanguage(sqlDialect)) {
      console.error(`Unknown SQL dialect: ${sqlDialect}`);
      console.error(`SQL dialects: ${supportedDialects.join(", ")}`);
      process.exit(1);
    }

    try {
      const input = await readStdin();
      const output = format({ language, input, printWidth, sqlDialect });

      process.stdout.write(output);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
  },
});

runMain(main);
