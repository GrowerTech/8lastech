import { z } from "zod";
import { assertSameOrigin, clientIp, ok, parseBody, publicRoute } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { tooMany } from "@/lib/server/errors";
import { rateLimit } from "@/lib/server/rate-limit";
import { idString, text } from "@/lib/server/util";

const schema = z
  .object({
    name: text(100).min(1),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: text(30).optional(),
    company: text(100).optional(),
    subject: text(150).optional(),
    message: text(5000).min(1),
    serviceId: idString.optional(),
    projectType: text(80).optional(),
    budget: text(60).optional(),
    // Honeypot: real users never fill this; bots do.
    website: z.string().max(200).optional(),
  })
  .strict();

/** Public lead capture. Returns only an acknowledgement — never stored data. */
export const POST = publicRoute(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req) ?? "unknown";
  const rl = rateLimit(`inquiry:${ip}`, 5, 60 * 60_000);
  if (!rl.ok) throw tooMany("Too many submissions, please try again later", rl.retryAfter);
  const { website, serviceId, ...data } = await parseBody(req, schema);
  if (website) return ok({ received: true }, undefined, 201); // silently drop bots
  const service = serviceId ? await db.service.findFirst({ where: { id: serviceId, status: "PUBLISHED" }, select: { id: true } }) : null;
  await db.inquiry.create({ data: { ...data, serviceId: service?.id ?? null, ipAddress: ip } });
  return ok({ received: true }, undefined, 201);
});
