import { createToolContext } from "../tools/createToolContext";

/** Links to the current view (`ShareLinkProvider`). */
export type ShareLink = {
  /** The link to the instrument and the open Finder's choice. */
  shareUrl(): string;
  /** Copies that link and says so in the page. */
  copyShareLink(): Promise<void>;
};

export const [ShareLinkContext, useShareLink] = createToolContext<ShareLink>("useShareLink");
