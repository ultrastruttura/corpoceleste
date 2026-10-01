import type { APIRoute } from "astro";
import { buildRobotsTxt, plainTextResponse } from "../lib/llms";

export const prerender = true;

export const GET: APIRoute = () => plainTextResponse(buildRobotsTxt());
