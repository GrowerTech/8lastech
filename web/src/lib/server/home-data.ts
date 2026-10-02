import { db } from "./db";
import { getPublicSettings, listPublicProjects, listPublicServices, listPublicTestimonials } from "./public";

// The public homepage must never break because the admin DB is empty or down:
// any failure resolves to null and the component renders its built-in content.
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error("[home-data]", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function getHomeData() {
  const [projects, services, testimonials, settings] = await Promise.all([
    safe(() => listPublicProjects({ pageSize: 4 })),
    safe(() => listPublicServices()),
    safe(() => listPublicTestimonials()),
    safe(() => getPublicSettings()),
  ]);
  return {
    projects: projects?.items.length ? projects.items : undefined,
    services: services?.length ? services : undefined,
    testimonials: testimonials?.length ? testimonials : undefined,
    settings: settings ?? undefined,
  };
}

export async function getHomeSeo() {
  const seo = await safe(() => db.pageSeo.findUnique({ where: { key: "home" }, include: { ogImage: { select: { url: true } } } }));
  if (!seo) return null;
  return { ...seo, robots: seo.robots.includes("noindex") ? { index: false, follow: !seo.robots.includes("nofollow") } : undefined };
}
