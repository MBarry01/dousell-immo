"use client";

import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

type NavItem = {
  label: string;
  href: string;
};

type HeroLandingProps = {
  logo?: React.ReactNode;
  title?: string;
  description?: string;
  announcement?: {
    badge?: string;
    text?: string;
  };
  navItems?: NavItem[];
  primaryCta?: {
    label?: string;
    href?: string;
  };
  secondaryCta?: {
    label?: string;
    href?: string;
  };
  gradient?: {
    top?: string;
    bottom?: string;
  };
  className?: string;
};

export default function HeroLanding({
  logo = "Logo",
  title = "Welcome to Our Platform",
  description = "Discover the power of innovation with our cutting-edge solutions.",
  announcement,
  navItems = [
    { label: "Product", href: "#" },
    { label: "Features", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ],
  primaryCta = { label: "Get Started", href: "#" },
  secondaryCta = { label: "Learn More", href: "#" },
  gradient = {
    top: "from-purple-500 to-pink-500",
    bottom: "from-green-400 to-blue-500",
  },
  className,
}: HeroLandingProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-black text-white",
        className
      )}
    >
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 -z-10">
        <div
          className={cn(
            "absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
            gradient.top
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tl opacity-20 blur-3xl",
            gradient.bottom
          )}
        />
      </div>

      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="text-2xl font-bold">{logo}</div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-gray-300 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Mobile Navigation */}
        <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DialogTrigger asChild>
            <button className="block md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Menu</DialogTitle>
              <DialogDescription>Navigation</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-gray-300 transition hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 text-center">
        {/* Announcement Badge */}
        {announcement && (
          <div className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
            {announcement.badge && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                {announcement.badge}
              </span>
            )}
            {announcement.text && (
              <span className="text-sm text-gray-300">{announcement.text}</span>
            )}
          </div>
        )}

        {/* Main Title */}
        <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          {title}
        </h1>

        {/* Description */}
        <p className="mb-10 max-w-2xl text-lg text-gray-400 md:text-xl">
          {description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href={primaryCta.href}
            className="rounded-full bg-white px-8 py-4 font-semibold text-black transition hover:bg-gray-200"
          >
            {primaryCta.label}
          </a>
          <a
            href={secondaryCta.href}
            className="rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold backdrop-blur-sm transition hover:bg-white/10"
          >
            {secondaryCta.label}
          </a>
        </div>
      </div>
    </div>
  );
}
