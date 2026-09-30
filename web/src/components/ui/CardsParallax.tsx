"use client";

import { FC, ReactNode } from "react";

interface iCardItem {
    title: string;
    description: string;
    icon: ReactNode;
    color: string;
    textColor: string;
}

interface iCardProps extends iCardItem {
    i: number;
}

const Card: FC<iCardProps> = ({ title, description, icon, color, textColor, i }) => {
    return (
        <div
            className="h-screen flex items-center justify-center sticky px-4"
            style={{ top: `${i * 2.5}rem` }}
        >
            <div
                className="relative flex flex-col w-full max-w-xl rounded-3xl border border-border p-10 sm:p-14 shadow-2xl shadow-black/40"
                style={{ backgroundColor: color }}
            >
                <div
                    className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mb-8"
                    aria-hidden="true"
                >
                    {icon}
                </div>
                <h3
                    className="font-heading text-3xl sm:text-4xl font-semibold mb-4 tracking-tight"
                    style={{ color: textColor }}
                >
                    {title}
                </h3>
                <p
                    className="text-lg sm:text-xl leading-relaxed"
                    style={{ color: textColor, opacity: 0.72 }}
                >
                    {description}
                </p>
            </div>
        </div>
    );
};

interface iCardsParallaxProps {
    items: iCardItem[];
}

// Each card's sticky offset increases with index, so it pins a little lower
// than the last and stacks on top of it as the section scrolls past.
const CardsParallax: FC<iCardsParallaxProps> = ({ items }) => {
    return (
        <div className="relative">
            {items.map((item, i) => (
                <Card key={item.title} {...item} i={i} />
            ))}
        </div>
    );
};

export { CardsParallax, type iCardItem };
