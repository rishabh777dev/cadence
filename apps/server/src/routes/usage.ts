import { createAppLogger } from "@cadence-voice/utils";
import { Hono } from "hono";
import { fetchCloudUsage } from "../lib/cadence-cloud.js";
import { formatError } from "../lib/format-error.js";
import { getSessionToken } from "../lib/sessions.js";

const log = createAppLogger("usage");

const usage = new Hono().get("/", async (c) => {
  const token = getSessionToken();
  if (!token) {
    return c.json({ error: "Not signed in to Cadence Cloud" }, 401);
  }
  try {
    const balance = await fetchCloudUsage(token);
    return c.json(balance);
  } catch (err) {
    log.warn(`failed to fetch cloud usage: ${formatError(err)}`);
    return c.json(
      {
        error: "Failed to fetch usage",
        detail: err instanceof Error ? err.message : String(err),
      },
      502,
    );
  }
});

export default usage;
