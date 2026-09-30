type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-4 max-w-2xl ${alignment}`}>
      <span className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-accent-2 uppercase">
        <span className="h-px w-8 bg-accent" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-muted text-base sm:text-lg leading-relaxed text-pretty">
          {description}
        </p>
      )}
    </div>
  );
}
