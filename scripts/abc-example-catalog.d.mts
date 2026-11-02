/** Type declarations for the Node-only ABC discovery helper. */
export type AbcCatalogEntry = { value: string; label: string; file: string };
export declare function discoverAbcExamples(directory: string): Promise<AbcCatalogEntry[]>;
