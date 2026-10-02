import Navbar from "@/components/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { getHomeData, getHomeSeo } from "@/lib/server/home-data";

// Content is managed in the admin; re-generate at most once a minute.
export const revalidate = 60;

// Admin-managed SEO for the home page; any field left empty falls through to the layout defaults.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getHomeSeo();
  if (!seo) return {};
  return {
    ...(seo.seoTitle && { title: seo.seoTitle }),
    ...(seo.metaDescription && { description: seo.metaDescription }),
    ...(seo.canonicalUrl && { alternates: { canonical: seo.canonicalUrl } }),
    robots: seo.robots,
    openGraph: {
      ...(seo.ogTitle && { title: seo.ogTitle }),
      ...(seo.ogDescription && { description: seo.ogDescription }),
      ...(seo.ogImage && { images: [seo.ogImage.url] }),
    },
  };
}

export default async function Home() {
  const { projects, services, testimonials, settings } = await getHomeData();
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services items={services} />
        <Process />
        <Portfolio items={projects} />
        <Testimonials items={testimonials} />
        <Contact settings={settings} />
      </main>
      <Footer settings={settings} />
    </>
  );
}
