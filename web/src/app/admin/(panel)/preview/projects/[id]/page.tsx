import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { getCurrentAdmin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Renders a draft/published project exactly as stored, admin-only (the panel layout also gates this).
export default async function Preview({ params }: PageProps<"/admin/preview/projects/[id]">) {
  const { id } = await params;
  if (!(await getCurrentAdmin())) notFound();
  const p = await db.project.findUnique({
    where: { id },
    include: { category: true, client: true, technologies: true, services: true, thumbnail: true, heroImage: true, gallery: { orderBy: { position: "asc" }, include: { media: true } } },
  });
  if (!p) notFound();
  return (
    <article className="max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-accent-2 mb-2">Preview · {p.status}</p>
      <h1 className="font-heading text-4xl font-semibold mb-3">{p.title}</h1>
      <p className="text-muted mb-6">{p.shortDescription}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {(p.heroImage ?? p.thumbnail) && <img src={(p.heroImage ?? p.thumbnail)!.url} alt={(p.heroImage ?? p.thumbnail)!.alt} className="rounded-2xl mb-6 w-full" />}
      <p className="whitespace-pre-wrap leading-relaxed mb-6">{p.description}</p>
      <p className="text-sm text-muted mb-6">{[p.category?.name, p.client?.name, ...p.technologies.map((t) => t.name)].filter(Boolean).join(" · ")}</p>
      {([["Features", p.features.join("\n")], ["Challenges", p.challenges], ["Solutions", p.solutions], ["Results", p.results]] as const).filter(([, t]) => t).map(([h, t]) => (
        <section key={h} className="mb-6"><h2 className="font-heading text-xl font-semibold mb-2">{h}</h2><p className="whitespace-pre-wrap text-foreground/90">{t}</p></section>
      ))}
      <div className="grid grid-cols-3 gap-3">
        {p.gallery.map((g) => <img key={g.id} src={g.media.url} alt={g.media.alt} className="rounded-lg" />)}
      </div>
    </article>
  );
}
