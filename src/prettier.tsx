import { BuiltInParserName, format } from "prettier";

import { Format } from "./format";
import { getPreferences } from "./preferences";
import { Formatter, Language } from "./types";

type Parser = BuiltInParserName;
type PrettierLanguage = Exclude<Language, "sql">;

const prettierParsers: Record<PrettierLanguage, Parser> = {
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

const { printWidth } = getPreferences();

const buildFormatter = (parser: Parser): Formatter => {
  return async (query) => format(query, { parser, printWidth });
};

const formatterEntries = Object.entries(prettierParsers).map(([language, parser]) => {
  const formatter = buildFormatter(parser);

  return [language, () => <Format language={language as Language} formatter={formatter} />];
});

const formatters = Object.fromEntries(formatterEntries) as Record<Language, JSX.Element>;

export default formatters;
