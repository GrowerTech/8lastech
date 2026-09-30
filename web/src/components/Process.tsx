import {
  MagnifyingGlass,
  Compass,
  Hammer,
  RocketLaunch,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import SectionHeading from "./ui/SectionHeading";
import ProcessScrollGallery from "./process/ProcessScrollGallery";

const STEPS = [
  {
    icon: <MagnifyingGlass size={22} weight="bold" />,
    title: "Discover",
    description: "We dig into your goals, users, and constraints before writing a spec.",
  },
  {
    icon: <Compass size={22} weight="bold" />,
    title: "Design",
    description: "Wireframes and UI systems that map strategy to a usable experience.",
  },
  {
    icon: <Hammer size={22} weight="bold" />,
    title: "Build",
    description: "Iterative development with regular check-ins, not a black box.",
  },
  {
    icon: <RocketLaunch size={22} weight="bold" />,
    title: "Launch",
    description: "Tested, optimized, and deployed with a plan for the first weeks live.",
  },
  {
    icon: <Wrench size={22} weight="bold" />,
    title: "Support",
    description: "Ongoing maintenance and iteration as a long-term technology partner.",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative py-28 sm:py-36 bg-background-alt">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="How We Work"
          title="A process built for clarity, not surprises"
        />

        <ProcessScrollGallery steps={STEPS} />
      </div>
    </section>
  );
}
