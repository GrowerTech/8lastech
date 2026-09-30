import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import SectionHeading from "./ui/SectionHeading";
import RevealOnScroll from "./ui/RevealOnScroll";
import TiltCard from "./TiltCard";

const PROJECTS = [
  {
    title: "FinFlow Dashboard",
    tag: "Web Application",
    gradient: "from-blue-600/40 via-blue-900/30 to-transparent",
  },
  {
    title: "Northstar Retail",
    tag: "E-Commerce Platform",
    gradient: "from-indigo-600/40 via-blue-900/30 to-transparent",
  },
  {
    title: "Vantage CRM",
    tag: "Custom Software",
    gradient: "from-sky-600/40 via-blue-900/30 to-transparent",
  },
  {
    title: "Orbit Mobile",
    tag: "UI/UX Design",
    gradient: "from-blue-500/40 via-indigo-900/30 to-transparent",
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="relative py-28 sm:py-36 bg-background">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Selected Work"
          title="Products we've helped bring to life"
          description="A snapshot of the kind of work we do — placeholders today, your project tomorrow."
        />

        <RevealOnScroll
          itemSelector="[data-project]"
          className="mt-16 grid gap-6 sm:grid-cols-2"
        >
          {PROJECTS.map((project) => (
            <div key={project.title} data-project>
              <TiltCard className="group relative h-72 rounded-2xl border border-border bg-card overflow-hidden cursor-pointer">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${project.gradient}`}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_60%)]"
                  aria-hidden="true"
                />
                <div className="relative h-full flex flex-col justify-end p-8">
                  <span className="text-xs uppercase tracking-widest text-accent-2 mb-2">
                    {project.tag}
                  </span>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-2xl font-semibold">
                      {project.title}
                    </h3>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur transition-all duration-300 group-hover:border-accent-2 group-hover:bg-accent group-hover:text-on-accent">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
