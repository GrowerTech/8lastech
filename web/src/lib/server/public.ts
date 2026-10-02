import { db } from "./db";

// Every public query uses explicit `select`s and a PUBLISHED/visible filter.
// Add fields here deliberately; never spread whole rows into public responses.
const media = { select: { url: true, alt: true, width: true, height: true } } as const;

const projectCard = {
  id: true, title: true, slug: true, shortDescription: true, featured: true, displayOrder: true, publishedAt: true,
  category: { select: { name: true, slug: true } },
  client: { select: { name: true, slug: true } },
  technologies: { where: { active: true }, orderBy: { displayOrder: "asc" as const }, select: { name: true, slug: true } },
  thumbnail: media,
} as const;

export async function listPublicProjects(o: { page?: number; pageSize?: number; category?: string; featured?: boolean; client?: string } = {}) {
  const page = Math.max(1, o.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, o.pageSize ?? 12));
  const where = {
    status: "PUBLISHED" as const,
    ...(o.category ? { category: { slug: o.category, enabled: true } } : {}),
    ...(o.client ? { client: { slug: o.client, visible: true } } : {}),
    ...(o.featured !== undefined ? { featured: o.featured } : {}),
  };
  const [items, total] = await Promise.all([
    db.project.findMany({ where, select: projectCard, orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    db.project.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export const getPublicProject = (slug: string) =>
  db.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      ...projectCard,
      description: true, features: true, challenges: true, solutions: true, results: true, projectUrl: true, githubUrl: true,
      startDate: true, completionDate: true, seo: true,
      heroImage: media,
      services: { where: { status: "PUBLISHED" }, select: { name: true, slug: true } },
      gallery: { orderBy: { position: "asc" }, select: { media } },
    },
  });

export const listPublicServices = () =>
  db.service.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true, name: true, slug: true, shortDescription: true, description: true, icon: true, features: true, benefits: true, featured: true,
      image: media, technologies: { where: { active: true }, select: { name: true, slug: true } },
    },
  });

export const listPublicClients = () =>
  db.client.findMany({
    where: { visible: true },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, company: true, slug: true, website: true, industry: true, location: true, description: true, featured: true, logo: media },
  });

export const listPublicTestimonials = () =>
  db.testimonial.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { displayOrder: "asc" },
    select: { id: true, clientName: true, company: true, designation: true, content: true, rating: true, featured: true, photo: media },
  });

export const getPublicSettings = () =>
  db.companySettings.findUnique({
    where: { id: "singleton" },
    select: {
      companyName: true, tagline: true, description: true, email: true, phones: true, whatsapp: true, address: true,
      businessHours: true, socialLinks: true, copyright: true, logo: media, favicon: media,
    },
  });
