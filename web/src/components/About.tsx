import { Target, Rocket, Handshake } from "@phosphor-icons/react/dist/ssr";
import SectionHeading from "./ui/SectionHeading";
import RevealOnScroll from "./ui/RevealOnScroll";
import { CardsParallax, type iCardItem } from "./ui/CardsParallax";

const PILLARS: iCardItem[] = [
  {
    title: "Strategy-first",
    description:
      "Every build starts with understanding your business goals, not just the feature list.",
    icon: <Target size={28} weight="duotone" className="text-accent-2" />,
    color: "var(--color-card)",
    textColor: "var(--color-foreground)",
  },
  {
    title: "Built to scale",
    description:
      "Modern architecture and clean code that grows with your business, not against it.",
    icon: <Rocket size={28} weight="duotone" className="text-accent-2" />,
    color: "var(--color-card-hover)",
    textColor: "var(--color-foreground)",
  },
  {
    title: "Long-term partner",
    description:
      "We stick around after launch — combining strategy, design, and development continuously.",
    icon: <Handshake size={28} weight="duotone" className="text-accent-2" />,
    color: "var(--color-background)",
    textColor: "var(--color-foreground)",
  },
];

export default function About() {
  return (
    <section id="about" className="relative py-28 sm:py-36 bg-background-alt">
      <div className="about-emerge mx-auto max-w-7xl px-6 sm:px-10">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="About 8LasTech"
            title="A technology partner that builds, innovates, and elevates."
            description="8LasTech is a technology and digital solutions company that helps businesses transform ideas and challenges into modern, scalable digital products — combining strategy, design, and development to improve how businesses operate, connect with customers, and grow."
          />
        </RevealOnScroll>
      </div>

      <div className="mt-8">
        <CardsParallax items={PILLARS} />
      </div>
    </section>
  );
}
