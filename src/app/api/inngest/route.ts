import { serve } from "inngest/next";

import { inngest } from "../../../../inngest/client";
import { functions } from "../../../../inngest/functions";

/**
 * Inngest calls this endpoint to discover and run the app's functions.
 * Locally the Dev Server signs requests for us; deployed environments use
 * INNGEST_SIGNING_KEY.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
