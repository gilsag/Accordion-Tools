/** Loads one TypeScript source file in isolation, with every runtime import
 * replaced by a test double.
 *
 * This is for modules whose contract is "what they call, and in which order":
 * transport lifecycles, capture sequences, and feature hooks tested through a
 * minimal React double. The module under test is the real production file;
 * only its dependencies are substituted, and an import that was not listed
 * fails the test, so a new dependency can never be picked up silently.
 *
 * Prefer a plain `import` for pure logic, and Testing Library for components.
 * Values returned by an isolated module belong to another realm: compare
 * them with assert.deepEqual on plain copies ({ ...value }, Array.from).
 */
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

/**
 * @param {string} path Source file, relative to the repository root.
 * @param {object} [options]
 * @param {Record<string, unknown> | ((specifier: string) => unknown)} [options.imports]
 *   Module specifier → double, or a function that returns the double or throws.
 * @param {Record<string, unknown>} [options.globals] Extra globals (window, document, timers…).
 * @param {(source: string) => string} [options.transformSource] Applied before compiling,
 *   e.g. to stand in for values Vite injects.
 * @param {boolean} [options.jsx] Compile JSX with the automatic runtime.
 * @param {boolean} [options.sameRealm] Run in the test's own realm, so returned arrays and
 *   objects compare with assert.deepEqual directly. The default is a separate realm, which
 *   also hides the test's globals from the module.
 * @returns {Record<string, any>} The module's exports.
 */
export function loadIsolated(path, { imports = {}, globals = {}, transformSource, jsx = false, sameRealm = false } = {}) {
  const original = readFileSync(path, "utf8");
  const source = transformSource ? transformSource(original) : original;
  const compiled = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      ...(jsx ? { jsx: ts.JsxEmit.ReactJSX } : {}),
    },
  }).outputText;
  const module = { exports: {} };
  const require = (specifier) => {
    if (typeof imports === "function") return imports(specifier);
    if (Object.hasOwn(imports, specifier)) return imports[specifier];
    throw new Error(`${path}: unexpected import "${specifier}". List it in imports with a test double.`);
  };
  if (sameRealm) {
    const names = Object.keys(globals);
    new Function("require", "module", "exports", ...names, compiled)(
      require, module, module.exports, ...names.map((name) => globals[name]));
  } else {
    runInNewContext(compiled, { ...globals, module, exports: module.exports, require }, { filename: path });
  }
  return module.exports;
}

/** Vite replaces import.meta.env.BASE_URL at build time; tests use the root. */
export const withRootBaseUrl = (source) => source.replaceAll("import.meta.env.BASE_URL", '"/"');
