import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// cPanel/Passenger may start Node with a working directory outside the app root.
// Always resolve .env relative to the backend directory. Existing cPanel
// environment variables keep precedence because dotenv override is disabled.
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const result = dotenv.config({ path: envPath, override: false });

if (result.error && result.error.code !== 'ENOENT') {
    throw result.error;
}

export { envPath };
