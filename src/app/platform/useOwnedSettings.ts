import { useEffect, useLayoutEffect, useRef } from "react";
import { ownedKeys, type OwnedSettings, type SettingsOwnerId } from "../../settings/settingsOwners";
import { usePlatformSettings } from "./platformContexts";

/**
 * Hands an owner's settings to the settings registry.
 *
 * `state` is the owner's hook result (or any object holding the same names):
 * the compiler requires it to contain every value and `set…` setter that
 * `SETTINGS_OWNERS` assigns to `owner`. Registration happens in a layout
 * effect, so every owner is registered before the registry's startup effect
 * runs; a change to one of the owner's values schedules the session save.
 */
export function useOwnedSettings<O extends SettingsOwnerId>(owner: O, state: OwnedSettings<O>) {
  const registry = usePlatformSettings();
  const latest = useRef(state);
  useLayoutEffect(() => {
    latest.current = state;
  });
  useLayoutEffect(() => registry.register(owner, () => latest.current), [registry, owner]);
  const values = state as unknown as Record<string, unknown>;
  const signature = JSON.stringify(ownedKeys(owner).map((key) => values[key]));
  useEffect(() => {
    registry.changed();
  }, [registry, signature]);
}
