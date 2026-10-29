import type { APIRoute } from "astro";
import { buildLlmsFullTxt, plainTextResponse } from "../../lib/llms";

export const prerender = true;

export const GET: APIRoute = () => plainTextResponse(buildLlmsFullTxt("de"));
