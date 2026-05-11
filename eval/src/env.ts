import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load the same project-root .env the proxy uses, so a single key store
// powers proxy, backend, and eval alike.
dotenv.config({ path: resolve(__dirname, "../../.env") });
