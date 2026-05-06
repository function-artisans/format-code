import { Detail } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useRef } from "react";

import { Formatter, Language } from "./types";
import { copyToClipboard, readFromClipboard, wrapWithCodeblock } from "./utils";

type PipelineArgs = {
  language: Language;
  formatter: Formatter;
};

const pipeline = async (args: PipelineArgs): Promise<string> => {
  const { language, formatter } = args;

  return readFromClipboard().then(formatter).then(copyToClipboard).then(wrapWithCodeblock(language));
};

type FormatProps = PipelineArgs;

export function Format(props: FormatProps) {
  const abortable = useRef<AbortController>();

  const { isLoading, data: markdown } = usePromise(pipeline, [props], { abortable });

  return <Detail isLoading={isLoading} markdown={markdown} />;
}
