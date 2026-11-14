import { createContext, useContext } from "react";

/** A tool's context and the hook that reads it. The hook throws a clear
 * error when used outside the tool's provider. */
export function createToolContext<T>(hookName: string) {
  const Context = createContext<T | null>(null);
  function useToolContext(): T {
    const value = useContext(Context);
    if (value === null) throw new Error(`${hookName}() must be called inside its tool provider.`);
    return value;
  }
  return [Context, useToolContext] as const;
}
