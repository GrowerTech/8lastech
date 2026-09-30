import { Quotes } from "@phosphor-icons/react/dist/ssr";
import SectionHeading from "./ui/SectionHeading";
import RevealOnScroll from "./ui/RevealOnScroll";

const TESTIMONIALS = [
  {
    quote:
      "8LasTech didn't just build what we asked for — they pushed back where it mattered and the product is better for it.",
    name: "Aarav Sharma",
    role: "Founder, Retail Startup",
  },
  {
    quote:
      "Communication was clear from kickoff to launch. No surprises, no scope creep, just steady progress.",
    name: "Priya Nair",
    role: "Operations Lead",
  },
  {
    quote:
      "The automation work alone saved our team hours every week. Genuinely felt like a technology partner, not a vendor.",
    name: "Diwas Karki",
    role: "COO, Logistics Company",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-28 sm:py-36 bg-background-alt">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading eyebrow="Client Voices" title="What partners say about working with us" />

        <RevealOnScroll
          itemSelector="[data-quote]"
          className="mt-16 grid gap-6 lg:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              data-quote
              className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between transition-all duration-300 hover:border-accent/50 hover:-translate-y-1"
            >
              <Quotes size={28} weight="fill" className="text-accent/50 mb-5" />
              <p className="text-foreground/90 leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-heading font-semibold">{t.name}</p>
                <p className="text-sm text-muted">{t.role}</p>
              </div>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
