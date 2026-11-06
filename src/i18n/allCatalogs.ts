/** Every interface catalog, registered synchronously. The application loads
 * catalogs on demand through loadInterfaceCatalog(); this module is for code
 * that needs all of them at once, such as the localization tests. */
import { EN } from "./en";
import { ES } from "./es";
import { FR } from "./fr";
import { PT } from "./pt";
import { IT } from "./it";
import { DE } from "./de";
import { registerInterfaceCatalog } from "./catalog";

registerInterfaceCatalog("es", ES);
registerInterfaceCatalog("fr", FR);
registerInterfaceCatalog("pt", PT);
registerInterfaceCatalog("it", IT);
registerInterfaceCatalog("de", DE);

export * from "./catalog";
export { EN, ES, FR, PT, IT, DE };
