{ ... }:

{
  languages.javascript = {
    enable = true;
    npm.enable = true;
  };

  git-hooks.hooks = {
    # Use the ESLint from node_modules, so the hook and CI use the same version.
    eslint = {
      enable = true;
      settings = {
        binPath = "./node_modules/.bin/eslint";
        extensions = "\\.(ts|mjs)$";
      };
    };

    # Use the Prettier from node_modules. Prettier reads the line length from .editorconfig.
    prettier = {
      enable = true;
      settings.binPath = "./node_modules/.bin/prettier";
    };

    # The hook list has no TypeScript hook, so the hook runs the npm script.
    tsc = {
      enable = true;
      name = "tsc";
      entry = "npm run types";
      files = "\\.ts$|^tsconfig\\.json$";
      pass_filenames = false;
    };

    actionlint.enable = true;
    check-json.enable = true;
    check-merge-conflicts.enable = true;
    check-yaml.enable = true;
    deadnix.enable = true;
    nixfmt.enable = true;
    ripsecrets.enable = true;
    typos.enable = true;

    # devenv generates devenv.lock without a final newline.
    editorconfig-checker = {
      enable = true;
      excludes = [ "^devenv\\.lock$" ];
    };
  };
}
