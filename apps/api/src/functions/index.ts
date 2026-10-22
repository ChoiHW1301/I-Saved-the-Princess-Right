import { app } from '@azure/functions';
import { readAuthConfig } from '../config/env.js';

// Fail initialization with the exact missing setting instead of waiting for the first request.
readAuthConfig();

import './health.js';
import './whoami.js';
import './profile.js';
import './save.js';
import './runs.js';
import './leaderboards.js';

// Export the app instance for the Azure Functions Node.js v4 programming model.
export { app };
