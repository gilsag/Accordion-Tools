import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { discoverAbcExamples } from "./scripts/abc-example-catalog.mjs";

const abcDirectory = fileURLToPath(new URL("./public/abc/", import.meta.url));

/** GitHub Pages does not expose directory listings. Generate its ABC index at build time. */
function abcCatalogPlugin(): Plugin {
  return {
    name: "abc-example-catalog",
    configureServer(server) {
      // The browser fetches the same URL in dev and in the published static build.
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?", 1)[0];
        if (path !== "/abc/examples.json" && path !== `${server.config.base}abc/examples.json`) {
          next();
          return;
        }
        void discoverAbcExamples(abcDirectory).then((examples) => {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(examples));
        }).catch((error: unknown) => {
          res.statusCode = 500;
          res.end(String(error));
        });
      });
      server.watcher.add(abcDirectory);
      const refresh = (path: string) => {
        if (/\.abc$/i.test(path)) server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
      server.watcher.on("change", refresh);
    },
    async generateBundle() {
      const examples = await discoverAbcExamples(abcDirectory);
      this.emitFile({
        type: "asset",
        fileName: "abc/examples.json",
        source: `${JSON.stringify(examples, null, 2)}\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), abcCatalogPlugin()],
  base: "/Accordion-Tools/",
});
