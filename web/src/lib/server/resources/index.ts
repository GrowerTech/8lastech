import { z } from "zod";
import { db } from "../db";
import { conflict } from "../errors";
import type { Resource } from "../crud";
import { idString, longText, optionalUrl, seoSchema, text } from "../util";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const order = z.number().int().min(0).max(100000);
const ids = z.array(idString).max(100);
const nullableId = idString.nullable();
const strList = z.array(text(300)).max(50);
const slug = z.string().trim().min(1).max(80);

const set = (key: string, ids?: string[]) => (ids ? { [key]: { set: ids.map((id) => ({ id })) } } : {});
const connectMany = (ids?: string[]) => (ids ? { connect: ids.map((id) => ({ id })) } : undefined);

/** Drops `undefined` so partial updates only touch provided fields. */
const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

const mediaSel = { select: { id: true, url: true, alt: true, width: true, height: true } };

// ── Categories ──
const categoryBase = z.object({ name: text(80).min(1), slug: slug.optional(), description: text(500).optional(), displayOrder: order.optional(), enabled: z.boolean().optional() }).strict();
const categories: Resource = {
  entity: "PROJECT_CATEGORY",
  get model() {
    return db.projectCategory as never;
  },
  create: categoryBase,
  update: categoryBase.partial(),
  searchFields: ["name"],
  sorts: ["name", "displayOrder"],
  defaultSort: "displayOrder",
  slugFrom: "name",
  include: { _count: { select: { projects: true } } },
  toData: (i) => clean({ name: i.name, description: i.description, displayOrder: i.displayOrder, enabled: i.enabled }),
  reorderable: true,
  permissions: {},
};

// ── Clients ──
const clientBase = z
  .object({
    name: text(120).min(1), slug: slug.optional(), company: text(120).optional(), logoId: nullableId.optional(), website: optionalUrl,
    industry: text(80).optional(), location: text(120).optional(), description: longText(2000).optional(),
    featured: z.boolean().optional(), visible: z.boolean().optional(), displayOrder: order.optional(),
  })
  .strict();
const clients: Resource = {
  entity: "CLIENT",
  get model() {
    return db.client as never;
  },
  create: clientBase,
  update: clientBase.partial(),
  searchFields: ["name", "company", "industry"],
  sorts: ["name", "displayOrder", "industry"],
  defaultSort: "displayOrder",
  slugFrom: "name",
  include: { logo: mediaSel, _count: { select: { projects: true } } },
  filters: (q) => clean({ visible: q.visible === undefined ? undefined : q.visible === "true", featured: q.featured === undefined ? undefined : q.featured === "true" }),
  toData: (i) => clean({ name: i.name, company: i.company, logoId: i.logoId, website: i.website, industry: i.industry, location: i.location, description: i.description, featured: i.featured, visible: i.visible, displayOrder: i.displayOrder }),
  deleteGuard: async (id) => {
    const n = await db.project.count({ where: { clientId: id } });
    if (n) throw conflict(`Client has ${n} project(s). Reassign or delete them first, or hide the client instead.`);
  },
  reorderable: true,
};

// ── Technologies ──
const techBase = z.object({ name: text(80).min(1), slug: slug.optional(), iconId: nullableId.optional(), category: text(60).optional(), website: optionalUrl, description: text(500).optional(), displayOrder: order.optional(), active: z.boolean().optional() }).strict();
const technologies: Resource = {
  entity: "TECHNOLOGY",
  get model() {
    return db.technology as never;
  },
  create: techBase,
  update: techBase.partial(),
  searchFields: ["name", "category"],
  sorts: ["name", "displayOrder", "category"],
  defaultSort: "displayOrder",
  slugFrom: "name",
  include: { icon: mediaSel },
  filters: (q) => clean({ active: q.active === undefined ? undefined : q.active === "true", category: q.category || undefined }),
  toData: (i) => clean({ name: i.name, iconId: i.iconId, category: i.category, website: i.website, description: i.description, displayOrder: i.displayOrder, active: i.active }),
  reorderable: true,
};

// ── Services ──
const serviceBase = z
  .object({
    name: text(100).min(1), slug: slug.optional(), shortDescription: text(300).optional(), description: longText().optional(),
    icon: z.string().trim().regex(/^[A-Za-z0-9]{0,60}$/, "Icon must be a Phosphor icon name").optional(), imageId: nullableId.optional(),
    features: strList.optional(), benefits: strList.optional(), displayOrder: order.optional(), featured: z.boolean().optional(),
    status: status.optional(), seo: seoSchema.nullable().optional(), technologyIds: ids.optional(),
  })
  .strict();
const services: Resource = {
  entity: "SERVICE",
  get model() {
    return db.service as never;
  },
  create: serviceBase,
  update: serviceBase.partial(),
  searchFields: ["name", "shortDescription"],
  sorts: ["name", "displayOrder", "status"],
  defaultSort: "displayOrder",
  slugFrom: "name",
  include: { image: mediaSel, technologies: { select: { id: true, name: true } } },
  filters: (q) => clean({ featured: q.featured === undefined ? undefined : q.featured === "true" }),
  toData: (i, mode) =>
    clean({
      name: i.name, shortDescription: i.shortDescription, description: i.description, icon: i.icon, imageId: i.imageId,
      features: i.features, benefits: i.benefits, displayOrder: i.displayOrder, featured: i.featured, status: i.status, seo: i.seo === null ? undefined : i.seo,
      technologies: mode === "create" ? connectMany(i.technologyIds as string[]) : (set("technologies", i.technologyIds as string[]).technologies as never),
    }),
  hasStatus: true,
  hasFeatured: true,
  reorderable: true,
};

// ── Testimonials ──
const testimonialBase = z
  .object({
    clientName: text(100).min(1), company: text(100).optional(), designation: text(100).optional(), photoId: nullableId.optional(),
    content: longText(2000).min(1), rating: z.number().int().min(1).max(5).nullable().optional(), clientId: nullableId.optional(), projectId: nullableId.optional(),
    featured: z.boolean().optional(), displayOrder: order.optional(), status: status.optional(),
  })
  .strict();
const testimonials: Resource = {
  entity: "TESTIMONIAL",
  get model() {
    return db.testimonial as never;
  },
  create: testimonialBase,
  update: testimonialBase.partial(),
  searchFields: ["clientName", "company", "content"],
  sorts: ["clientName", "displayOrder", "status"],
  defaultSort: "displayOrder",
  include: { photo: mediaSel },
  toData: (i) => clean({ ...i }),
  hasStatus: true,
  hasFeatured: true,
  reorderable: true,
};

// ── Projects ──
const dateField = z.union([z.coerce.date(), z.null()]);
const projectBase = z
  .object({
    title: text(150).min(1), slug: slug.optional(), shortDescription: text(300).optional(), description: longText().optional(),
    categoryId: nullableId.optional(), clientId: nullableId.optional(), technologyIds: ids.optional(), serviceIds: ids.optional(),
    status: status.optional(), thumbnailId: nullableId.optional(), heroImageId: nullableId.optional(),
    gallery: z.array(z.object({ mediaId: idString }).strict()).max(50).optional(),
    features: strList.optional(), challenges: longText(5000).optional(), solutions: longText(5000).optional(), results: longText(5000).optional(),
    projectUrl: optionalUrl, githubUrl: optionalUrl, startDate: dateField.optional(), completionDate: dateField.optional(),
    featured: z.boolean().optional(), displayOrder: order.optional(), seo: seoSchema.nullable().optional(),
  })
  .strict();
const datesOk = (v: { startDate?: Date | null; completionDate?: Date | null }) => !(v.startDate && v.completionDate) || v.completionDate >= v.startDate;
const datesMsg = { message: "completionDate must be on or after startDate", path: ["completionDate"] };
const projectCreate = projectBase.refine(datesOk, datesMsg);
const projectUpdate = projectBase.partial().refine(datesOk, datesMsg);

const projects: Resource = {
  entity: "PROJECT",
  get model() {
    return db.project as never;
  },
  create: projectCreate as never,
  update: projectUpdate as never,
  searchFields: ["title", "shortDescription"],
  sorts: ["title", "displayOrder", "status", "publishedAt"],
  defaultSort: "displayOrder",
  slugFrom: "title",
  include: {
    category: { select: { id: true, name: true } },
    client: { select: { id: true, name: true } },
    technologies: { select: { id: true, name: true } },
    services: { select: { id: true, name: true } },
    thumbnail: mediaSel,
    heroImage: mediaSel,
    gallery: { orderBy: { position: "asc" }, include: { media: mediaSel } },
  },
  filters: (q) =>
    clean({
      categoryId: q.categoryId || undefined,
      clientId: q.clientId || undefined,
      featured: q.featured === undefined ? undefined : q.featured === "true",
    }),
  toData: (raw, mode, current) => {
    const i = raw as z.infer<typeof projectUpdate>;
    const publishing = i.status === "PUBLISHED" && !current?.publishedAt;
    return clean({
      title: i.title, shortDescription: i.shortDescription, description: i.description, categoryId: i.categoryId, clientId: i.clientId,
      status: i.status, thumbnailId: i.thumbnailId, heroImageId: i.heroImageId, features: i.features, challenges: i.challenges,
      solutions: i.solutions, results: i.results, projectUrl: i.projectUrl, githubUrl: i.githubUrl, startDate: i.startDate,
      completionDate: i.completionDate, featured: i.featured, displayOrder: i.displayOrder, seo: i.seo === null ? undefined : i.seo,
      publishedAt: publishing ? new Date() : undefined,
      technologies: mode === "create" ? connectMany(i.technologyIds) : (set("technologies", i.technologyIds).technologies as never),
      services: mode === "create" ? connectMany(i.serviceIds) : (set("services", i.serviceIds).services as never),
      // Prisma runs nested writes inside one transaction: gallery replacement is atomic with the update.
      gallery: i.gallery
        ? mode === "create"
          ? { create: i.gallery.map((g, position) => ({ mediaId: g.mediaId, position })) }
          : { deleteMany: {}, create: i.gallery.map((g, position) => ({ mediaId: g.mediaId, position })) }
        : undefined,
    });
  },
  hasStatus: true,
  hasFeatured: true,
  reorderable: true,
};

export const RESOURCES: Record<string, Resource> = {
  projects,
  "project-categories": categories,
  clients,
  technologies,
  services,
  testimonials,
};
