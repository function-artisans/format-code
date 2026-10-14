# format-code

Formats source code from stdin and writes the formatted code to stdout.

## Install

```sh
npm install
npm run build
npm link
```

## Usage

```sh
format-code <language> [--print-width=100] [--sql-dialect=sql] < input
```

Languages: `angular`, `css`, `glimmer`, `graphql`, `html`, `javascript`, `json`,
`json5`, `less`, `lwc`, `markdown`, `mdx`, `scss`, `typescript`, `vue`, `yaml`,
`sql`, `sql-output`.

The `sql-output` language formats a SQL query and its result as two Markdown code
blocks.

To format the code on the macOS clipboard, run:

```sh
pbpaste | format-code json | pbcopy
```

## macOS shortcuts

To generate a signed shortcut for each language, run:

```sh
format-code shortcuts --sql-dialect postgresql
```

Each shortcut formats the code on the clipboard and copies the result back to the
clipboard. The command writes the files to the current directory. To import a
shortcut, open its file:

```sh
open "Format JSON.shortcut"
```

To see all the options, run `format-code shortcuts --help`.
