"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { List, X } from "@phosphor-icons/react";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#portfolio", label: "Work" },
  { href: "#testimonials", label: "Testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 sm:px-10 h-20 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo-icon-v2.png"
            alt="8LasTech logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
            priority
          />
          <span className="font-heading text-lg font-semibold tracking-tight">
            8Las<span className="text-accent-2">Tech</span>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden md:inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-all duration-200 hover:bg-accent-2 active:scale-95"
        >
          Let&apos;s Talk
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full border border-border text-foreground"
        >
          {open ? <X size={20} /> : <List size={20} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-6 py-6 flex flex-col gap-5">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base text-foreground/90 hover:text-accent-2 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-on-accent"
          >
            Let&apos;s Talk
          </a>
        </div>
      )}
    </header>
  );
}
