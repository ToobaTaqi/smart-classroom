import { Inngest } from "inngest";

/**
 * The single Inngest client for the app. Keep the `id` stable: it is used to
 * group this app's functions in the Inngest Dev Server and Cloud.
 */
export const inngest = new Inngest({
  id: "smart-classroom",
});
