import Image from "next/image";
import { EnvelopeSimple, Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#portfolio", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-background-alt">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-icon-v2.png"
              alt="8LasTech logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
            />
            <span className="font-heading text-lg font-semibold">
              8Las<span className="text-accent-2">Tech</span>
            </span>
          </div>
          <p className="text-muted max-w-sm leading-relaxed">
            Build. Innovate. Elevate. A technology and digital solutions
            company helping businesses turn ideas into modern, scalable
            products.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground/90 mb-4">Navigate</h4>
          <ul className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-muted hover:text-accent-2 transition-colors text-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground/90 mb-4">Contact</h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <a
                href="mailto:8lastech@gmail.com"
                className="flex items-center gap-2 text-muted hover:text-accent-2 transition-colors"
              >
                <EnvelopeSimple size={16} />
                8lastech@gmail.com
              </a>
            </li>
            <li>
              <a
                href="tel:+9779860658312"
                className="flex items-center gap-2 text-muted hover:text-accent-2 transition-colors"
              >
                <Phone size={16} />
                9860658312 / 9820409071
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/9779860658312"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted hover:text-accent-2 transition-colors"
              >
                <WhatsappLogo size={16} />
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-2">
          © {new Date().getFullYear()} 8LasTech. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
