import { format } from "sql-formatter";

import { Format } from "./format";
import { getPreferences } from "./preferences";
import { Formatter } from "./types";

export const formatSQL: Formatter = async (input) => {
  const { sqlDialect } = getPreferences();

  return format(input, {
    language: sqlDialect,
    functionCase: "upper",
    dataTypeCase: "lower",
    keywordCase: "upper",
  });
};

export default () => <Format language="sql" formatter={formatSQL} />;
