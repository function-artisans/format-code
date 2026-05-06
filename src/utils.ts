import { Clipboard } from "@raycast/api";

import { Language } from "./types";

export const readFromClipboard = async (): Promise<string> => (await Clipboard.readText()) || "";

export const copyToClipboard = async (code: string): Promise<string> => {
  await Clipboard.copy(code);
  return code;
};

export const wrapWithCodeblock = (language?: Language) => {
  return (code: string) => ["```", language ? ` ${language}` : "", "\n", code, "\n", "```"].join("");
};
