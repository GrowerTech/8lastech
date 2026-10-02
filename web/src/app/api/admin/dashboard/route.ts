import { adminRoute, ok } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { can } from "@/lib/server/permissions";

export const GET = adminRoute({ permission: "content:read" }, async ({ admin }) => {
  const canInquiries = can(admin.role, "inquiries:read");
  const canAudit = can(admin.role, "audit:read");
  const [totalProjects, publishedProjects, totalClients, activeServices, testimonials, recentProjects, unreadInquiries, recentInquiries, recentActivity] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { status: "PUBLISHED" } }),
    db.client.count(),
    db.service.count({ where: { status: "PUBLISHED" } }),
    db.testimonial.count(),
    db.project.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
    canInquiries ? db.inquiry.count({ where: { read: false } }) : null,
    canInquiries ? db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, status: true, read: true, createdAt: true } }) : null,
    canAudit ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, action: true, entity: true, actorEmail: true, createdAt: true } }) : null,
  ]);
  return ok({ totalProjects, publishedProjects, totalClients, activeServices, testimonials, unreadInquiries, recentProjects, recentInquiries, recentActivity });
});
