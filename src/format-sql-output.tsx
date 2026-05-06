import { Detail } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useRef } from "react";
import { formatSQL } from "./format-sql";

import { copyToClipboard, readFromClipboard, wrapWithCodeblock } from "./utils";

const wrapAsSQL = wrapWithCodeblock("sql");

const wrapAsPlain = wrapWithCodeblock();

const hasContent = (input?: string) => {
  return input && 0 < input.trim().length;
};

const dividers = [/\n(?=[┌╔])/, /(?<=;)\n/];

type Parts = readonly [string, string];

const splitInput = (input: string): Parts | undefined => {
  for (const divider of dividers) {
    const [sql, output] = input.split(divider, 2);
    if (hasContent(sql) && hasContent(output)) {
      return [sql, output] as const;
    }
  }
};

const safeFormatSQL = async (input: string): Promise<string> => {
  try {
    return await formatSQL(input);
  } catch {
    return input;
  }
};

const pipeline = async (): Promise<string> => {
  const input = await readFromClipboard();

  const result = splitInput(input);
  if (!result) throw new Error("Invalid input");
  const [sql, output] = result;

  const outputPlain = wrapAsPlain(output.trim());

  const formattedSQL = await safeFormatSQL(sql.trim());

  const clipboard = [wrapAsPlain(formattedSQL), outputPlain].join("\n");
  await copyToClipboard(clipboard);

  return [wrapAsSQL(formattedSQL), outputPlain].join("\n");
};

function SQLOutputFormat() {
  const abortable = useRef<AbortController>();

  const { isLoading, data: markdown } = usePromise(pipeline, [], { abortable });

  return <Detail isLoading={isLoading} markdown={markdown} />;
}

export default () => <SQLOutputFormat />;
