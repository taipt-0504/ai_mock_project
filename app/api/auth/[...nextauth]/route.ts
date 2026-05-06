import { handlers } from "@/src/lib/auth";

export const { GET, POST } = handlers;

// Auth.js's Prisma adapter requires the Node.js runtime (Prisma's binary
// engine cannot run on Edge). Without this declaration the build may pick
// Edge by default for an `app/api/**` route — Login spec TR-003.
export const runtime = "nodejs";
