import type { ManagerConfig, Row } from "./ResourceManager";
import { Badge } from "./ui";

const yes = (b: boolean, on = "Yes") => (b ? <Badge tone="green">{on}</Badge> : <Badge>No</Badge>);
const ids = (key: string) => (r: Row) => (r[key] ?? []).map((x: Row) => x.id);
const media = (key: string) => (r: Row) => r[key] ?? null;
const STATUS_FIELD = { name: "status", label: "Status", type: "select", half: true, perm: "content:publish", options: ["DRAFT", "PUBLISHED", "ARCHIVED"].map((v) => ({ value: v, label: v })) } as const;

export const CONFIGS: Record<string, ManagerConfig> = {
  projects: {
    resource: "projects", title: "Projects", singular: "project", hasStatus: true, hasFeatured: true, reorderable: true,
    previewHref: (r) => `/admin/preview/projects/${r.id}`,
    defaults: { status: "DRAFT", featured: false, features: [], technologyIds: [], serviceIds: [], gallery: [] },
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category", render: (r) => r.category?.name ?? "—" },
      { key: "client", label: "Client", render: (r) => r.client?.name ?? "—" },
      { key: "status", label: "Status" },
      { key: "featured", label: "Featured", render: (r) => yes(r.featured, "Featured") },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", half: true, help: "Leave blank to generate from the title." },
      STATUS_FIELD,
      { name: "shortDescription", label: "Short description", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "categoryId", label: "Category", type: "relation", relation: { resource: "project-categories", label: "name" }, half: true },
      { name: "clientId", label: "Client", type: "relation", relation: { resource: "clients", label: "name" }, half: true },
      { name: "technologyIds", label: "Technologies", type: "relation-multi", relation: { resource: "technologies", label: "name" }, read: ids("technologies") },
      { name: "serviceIds", label: "Services", type: "relation-multi", relation: { resource: "services", label: "name" }, read: ids("services") },
      { name: "thumbnailId", label: "Thumbnail", type: "media", half: true, read: media("thumbnail") },
      { name: "heroImageId", label: "Hero image", type: "media", half: true, read: media("heroImage") },
      { name: "gallery", label: "Gallery", type: "media-multi", read: (r) => (r.gallery ?? []).map((g: Row) => g.media) },
      { name: "features", label: "Features", type: "list" },
      { name: "challenges", label: "Challenges", type: "textarea" },
      { name: "solutions", label: "Solutions", type: "textarea" },
      { name: "results", label: "Results", type: "textarea" },
      { name: "projectUrl", label: "Project URL", type: "url", half: true },
      { name: "githubUrl", label: "GitHub URL", type: "url", half: true },
      { name: "startDate", label: "Start date", type: "date", half: true },
      { name: "completionDate", label: "Completion date", type: "date", half: true },
      { name: "featured", label: "Featured", type: "boolean", perm: "content:publish", half: true },
    ],
  },
  "project-categories": {
    resource: "project-categories", title: "Project categories", singular: "category", reorderable: true, defaults: { enabled: true },
    columns: [
      { key: "name", label: "Name" },
      { key: "projects", label: "Projects", render: (r) => r._count?.projects ?? 0 },
      { key: "enabled", label: "Enabled", render: (r) => yes(r.enabled, "Enabled") },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "slug", label: "Slug", type: "text", half: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "enabled", label: "Enabled", type: "boolean" },
    ],
  },
  clients: {
    resource: "clients", title: "Clients", singular: "client", reorderable: true, hasFeatured: true, defaults: { visible: true, featured: false },
    columns: [
      { key: "name", label: "Name" },
      { key: "industry", label: "Industry" },
      { key: "projects", label: "Projects", render: (r) => r._count?.projects ?? 0 },
      { key: "visible", label: "Visible", render: (r) => yes(r.visible, "Visible") },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "company", label: "Company", type: "text", half: true },
      { name: "slug", label: "Slug", type: "text", half: true },
      { name: "industry", label: "Industry", type: "text", half: true },
      { name: "website", label: "Website", type: "url", half: true },
      { name: "location", label: "Location", type: "text", half: true },
      { name: "logoId", label: "Logo", type: "media", read: media("logo") },
      { name: "description", label: "Description", type: "textarea" },
      { name: "visible", label: "Visible on website", type: "boolean", half: true },
      { name: "featured", label: "Featured", type: "boolean", half: true, perm: "content:publish" },
    ],
  },
  services: {
    resource: "services", title: "Services", singular: "service", hasStatus: true, hasFeatured: true, reorderable: true,
    defaults: { status: "DRAFT", featured: false, features: [], benefits: [], technologyIds: [] },
    columns: [{ key: "name", label: "Name" }, { key: "status", label: "Status" }, { key: "featured", label: "Featured", render: (r) => yes(r.featured, "Featured") }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "slug", label: "Slug", type: "text", half: true },
      STATUS_FIELD,
      { name: "icon", label: "Icon (Phosphor name)", type: "text", half: true, help: "e.g. Browsers, Code, GearSix" },
      { name: "shortDescription", label: "Short description", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Image", type: "media", read: media("image") },
      { name: "features", label: "Features", type: "list" },
      { name: "benefits", label: "Benefits", type: "list" },
      { name: "technologyIds", label: "Technologies", type: "relation-multi", relation: { resource: "technologies", label: "name" }, read: ids("technologies") },
      { name: "featured", label: "Featured", type: "boolean", perm: "content:publish" },
    ],
  },
  technologies: {
    resource: "technologies", title: "Technologies", singular: "technology", reorderable: true, defaults: { active: true },
    columns: [{ key: "name", label: "Name" }, { key: "category", label: "Category" }, { key: "active", label: "Active", render: (r) => yes(r.active, "Active") }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "category", label: "Category", type: "text", half: true },
      { name: "website", label: "Website", type: "url", half: true },
      { name: "iconId", label: "Icon", type: "media", half: true, read: media("icon") },
      { name: "description", label: "Description", type: "textarea" },
      { name: "active", label: "Active", type: "boolean" },
    ],
  },
  testimonials: {
    resource: "testimonials", title: "Testimonials", singular: "testimonial", hasStatus: true, hasFeatured: true, reorderable: true,
    defaults: { status: "DRAFT", featured: false },
    columns: [
      { key: "clientName", label: "Name" },
      { key: "company", label: "Company" },
      { key: "rating", label: "Rating", render: (r) => r.rating ?? "—" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "clientName", label: "Client name", type: "text", required: true, half: true },
      { name: "company", label: "Company", type: "text", half: true },
      { name: "designation", label: "Designation", type: "text", half: true },
      { name: "rating", label: "Rating (1-5)", type: "number", half: true },
      { name: "content", label: "Testimonial", type: "textarea", required: true },
      { name: "photoId", label: "Photo", type: "media", read: media("photo") },
      { name: "clientId", label: "Client", type: "relation", relation: { resource: "clients", label: "name" }, half: true },
      { name: "projectId", label: "Project", type: "relation", relation: { resource: "projects", label: "title" }, half: true },
      STATUS_FIELD,
      { name: "featured", label: "Featured", type: "boolean", perm: "content:publish", half: true },
    ],
  },
};
