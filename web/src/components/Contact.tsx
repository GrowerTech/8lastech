"use client";

import { useState, type FormEvent } from "react";
import {
  EnvelopeSimple,
  Phone,
  WhatsappLogo,
  PaperPlaneTilt,
  CheckCircle,
} from "@phosphor-icons/react";
import SectionHeading from "./ui/SectionHeading";
import RevealOnScroll from "./ui/RevealOnScroll";

type FormState = {
  name: string;
  email: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const CONTACT_EMAIL = "8lastech@gmail.com";

export default function Contact() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  const validate = (data: FormState): Errors => {
    const next: Errors = {};
    if (!data.name.trim()) next.name = "Please enter your name.";
    if (!data.email.trim()) {
      next.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!data.message.trim()) next.message = "Tell us a little about your project.";
    return next;
  };

  const handleBlur = (field: keyof FormState) => {
    setErrors((prev) => ({ ...prev, ...validate(form) }));
    void field;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const subject = encodeURIComponent(`New project inquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setStatus("sent");
  };

  return (
    <section id="contact" className="relative py-28 sm:py-36 bg-background overflow-hidden">
      <div className="absolute inset-0 glow-accent opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="Get In Touch"
          title="Let's build something worth elevating"
          description="Tell us about your project, or reach out directly — we usually reply within a business day."
        />

        <RevealOnScroll className="mt-16 grid gap-10 lg:grid-cols-5">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-3 rounded-2xl border border-border bg-card p-8 sm:p-10 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground/90">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => handleBlur("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-2 focus:outline-none transition-colors"
                placeholder="Your full name"
              />
              {errors.name && (
                <p id="name-error" role="alert" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground/90">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={() => handleBlur("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-2 focus:outline-none transition-colors"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-sm font-medium text-foreground/90">
                Project details <span className="text-destructive">*</span>
              </label>
              <textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                onBlur={() => handleBlur("message")}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
                className="rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-2 focus:border-accent-2 focus:outline-none transition-colors resize-none"
                placeholder="What are you looking to build?"
              />
              {errors.message && (
                <p id="message-error" role="alert" className="text-sm text-destructive">
                  {errors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-medium text-on-accent transition-all duration-200 hover:bg-accent-2 active:scale-95"
            >
              {status === "sent" ? (
                <>
                  <CheckCircle size={18} weight="fill" />
                  Opening your email app…
                </>
              ) : (
                <>
                  Send Message
                  <PaperPlaneTilt size={18} weight="bold" />
                </>
              )}
            </button>
            <p aria-live="polite" className="sr-only">
              {status === "sent" ? "Message ready to send via your email client." : ""}
            </p>
          </form>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-accent/50 hover:-translate-y-0.5"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-2 transition-colors group-hover:bg-accent group-hover:text-on-accent">
                <EnvelopeSimple size={22} weight="duotone" />
              </span>
              <span>
                <span className="block text-sm text-muted">Email</span>
                <span className="block font-medium">{CONTACT_EMAIL}</span>
              </span>
            </a>

            <a
              href="tel:+9779860658312"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-accent/50 hover:-translate-y-0.5"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-2 transition-colors group-hover:bg-accent group-hover:text-on-accent">
                <Phone size={22} weight="duotone" />
              </span>
              <span>
                <span className="block text-sm text-muted">Call</span>
                <span className="block font-medium">9860658312 / 9820409071</span>
              </span>
            </a>

            <a
              href="https://wa.me/9779860658312"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-accent/50 hover:-translate-y-0.5"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-2 transition-colors group-hover:bg-accent group-hover:text-on-accent">
                <WhatsappLogo size={22} weight="duotone" />
              </span>
              <span>
                <span className="block text-sm text-muted">WhatsApp</span>
                <span className="block font-medium">9860658312</span>
              </span>
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
