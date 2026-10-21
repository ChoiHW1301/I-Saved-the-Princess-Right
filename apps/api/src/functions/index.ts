import { app } from '@azure/functions';

import './health.js';
import './whoami.js';

// Export the app instance for the Azure Functions Node.js v4 programming model.
export { app };
