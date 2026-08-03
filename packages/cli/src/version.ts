// Read version from package.json so it can't drift on release.
// (Static import of ../package.json breaks tsc: the file sits outside rootDir.)
import { createRequire } from "node:module";
const { version } = createRequire(import.meta.url)("../package.json");
export const VERSION: string = version;
