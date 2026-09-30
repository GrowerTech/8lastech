import {
  Browsers,
  DeviceMobile,
  Code,
  PaintBrush,
  GearSix,
  ChartLineUp,
} from "@phosphor-icons/react/dist/ssr";
import SectionHeading from "./ui/SectionHeading";
import RevealOnScroll from "./ui/RevealOnScroll";

const SERVICES = [
  {
    icon: Browsers,
    title: "Web Applications",
    description:
      "Scalable, high-performance web apps built with modern frameworks — from MVPs to enterprise platforms.",
  },
  {
    icon: DeviceMobile,
    title: "Websites & Portals",
    description:
      "Fast, responsive marketing sites and customer portals designed to convert and built to last.",
  },
  {
    icon: Code,
    title: "Custom Software",
    description:
      "Tailored software solutions engineered around your exact workflows and business logic.",
  },
  {
    icon: PaintBrush,
    title: "UI/UX Design",
    description:
      "Research-driven interface design that balances aesthetics, usability, and brand identity.",
  },
  {
    icon: GearSix,
    title: "Automation",
    description:
      "Streamline repetitive processes and integrate systems to save time and reduce operational cost.",
  },
  {
    icon: ChartLineUp,
    title: "Tech Consulting",
    description:
      "Strategic guidance on architecture, tooling, and roadmap so technology decisions compound in your favor.",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-28 sm:py-36 bg-background">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="What We Do"
          title="Full-spectrum digital solutions"
          description="From the first line of code to long-term support, we cover the technology needs businesses actually run into."
        />

        <RevealOnScroll
          itemSelector="[data-service]"
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              data-service
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-accent/60 hover:bg-card-hover hover:-translate-y-1"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/0 blur-2xl transition-all duration-500 group-hover:bg-accent/20"
                aria-hidden="true"
              />
              <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-2 mb-5 transition-colors duration-300 group-hover:bg-accent group-hover:text-on-accent">
                <Icon size={24} weight="duotone" />
              </div>
              <h3 className="relative font-heading text-lg font-semibold mb-2">
                {title}
              </h3>
              <p className="relative text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
