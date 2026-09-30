import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteUser, listUsers } from "../../server/portal/auth.js";
import { json, requireUser } from "../../server/portal/http.js";

/** Admin: list / delete artist users. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireUser(req, res, "admin");
  if (!admin) return;

  try {
    if (req.method === "GET") {
      return json(res, 200, { users: await listUsers() });
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id || "");
      if (!id) return json(res, 400, { error: "Missing id" });
      await deleteUser(id);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("account users", err);
    return json(res, 500, { error: err instanceof Error ? err.message : "Server error" });
  }
}
