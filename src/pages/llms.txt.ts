import type { APIRoute } from "astro";
import { buildLlmsTxt, plainTextResponse } from "../lib/llms";

export const prerender = true;

export const GET: APIRoute = () => plainTextResponse(buildLlmsTxt("it"));
