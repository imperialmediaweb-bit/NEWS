/**
 * One address for every "review it in the admin" link in notification emails.
 * The admin login cookie is per domain, so links pointing at each state's own
 * domain forced a new login on every one of the 50 sites. All admin pages show
 * every state anyway, so one domain is enough. Override with ADMIN_URL.
 */
export const ADMIN_URL = (process.env.ADMIN_URL || "https://news-production-dd80.up.railway.app").replace(/\/$/, "");
