import { BuiltInParserName } from "prettier";
import { SqlLanguage, supportedDialects } from "sql-formatter";

export type PrettierLanguage =
  | "angular"
  | "css"
  | "glimmer"
  | "graphql"
  | "html"
  | "javascript"
  | "json"
  | "json5"
  | "less"
  | "lwc"
  | "markdown"
  | "mdx"
  | "scss"
  | "typescript"
  | "vue"
  | "yaml";

export type Language = PrettierLanguage | "sql" | "sql-output";

export const prettierParsers: Record<PrettierLanguage, BuiltInParserName> = {
  angular: "angular",
  css: "css",
  glimmer: "glimmer",
  graphql: "graphql",
  html: "html",
  javascript: "babel",
  json5: "json5",
  json: "json",
  less: "less",
  lwc: "lwc",
  markdown: "markdown",
  mdx: "mdx",
  scss: "scss",
  typescript: "typescript",
  vue: "vue",
  yaml: "yaml",
};

export const languages: Language[] = [...(Object.keys(prettierParsers) as PrettierLanguage[]), "sql", "sql-output"];

export function isLanguage(value: string): value is Language {
  return (languages as string[]).includes(value);
}

export function isSqlLanguage(value: string): value is SqlLanguage {
  return supportedDialects.includes(value);
}

export function parsePrintWidth(value: string): number | undefined {
  const printWidth = Number(value);
  return Number.isInteger(printWidth) && printWidth > 0 ? printWidth : undefined;
}
