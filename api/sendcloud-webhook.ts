import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleSendcloudWebhook } from "../server/sendcloud-webhook-handler.js";

/** Raw body required for Sendcloud-Signature HMAC (do not JSON-parse first). */
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleSendcloudWebhook(req, res);
}
