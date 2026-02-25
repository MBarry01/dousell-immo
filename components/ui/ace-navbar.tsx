"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link, { LinkProps } from "next/link";
import Image from "next/image";
import { CldImageSafe } from "@/components/ui/CldImageSafe";
import { cn } from "@/lib/utils";

const transition: any = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.p
        transition={{ duration: 0.3 }}
        className="cursor-pointer text-gray-300 hover:text-[#F4C430] text-sm font-medium transition-colors"
      >
        {item}
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              {/* Invisible bridge to prevent hover gap - covers the space between trigger and dropdown */}
              <div className="h-4 w-full" />
              <motion.div
                transition={transition}
                layoutId="active"
                className="bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border border-[#F4C430]/20 shadow-2xl"
              >
                <motion.div layout className="w-max h-full p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export type NavItem = {
  title: string;
  href: string;
};

export type ProductItemType = {
  title: string;
  href: string;
  src: string;
  description: string;
};

export type LogoConfig = {
  src?: string;
  alt: string;
  href: string;
  width?: number;
  height?: number;
  text?: string;
};

export type NavbarConfig = {
  logo: LogoConfig;
  mainNav: {
    firstGroup: {
      title: string;
      items: NavItem[];
    };
    products: {
      title: string;
      items: ProductItemType[];
    };
    lastGroup: {
      title: string;
      items: NavItem[];
    };
  };
  cta?: {
    text: string;
    href: string;
  };
};

export default function AceNavbar({
  className,
  config,
}: {
  className?: string;
  config: NavbarConfig;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 max-w-3xl mx-auto z-50 px-4 md:px-0",
          className
        )}
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <Menu setActive={setActive}>
          <div className="flex items-center w-full justify-between">
            {/* Logo */}
            <div className="shrink-0">
              <Link href={config.logo.href} className="flex items-center gap-2">
                {config.logo.src ? (
                  <CldImageSafe
                    src={config.logo.src}
                    alt={config.logo.alt}
                    width={config.logo.width || 32}
                    height={config.logo.height || 32}
                    className="h-8 w-auto rounded-md"
                  />
                ) : null}
                {config.logo.text && (
                  <span className="font-bold text-lg gradient-text-animated">
                    {config.logo.text}
                  </span>
                )}
              </Link>
            </div>

            {/* Navigation Desktop */}
            <div className="hidden md:flex flex-1 items-center justify-center space-x-6">
              <MenuItem
                setActive={setActive}
                active={active}
                item={config.mainNav.firstGroup.title}
              >
                <div className="flex flex-col space-y-4 text-sm">
                  {config.mainNav.firstGroup.items.map((item) => (
                    <HoveredLink key={item.href} href={item.href}>
                      {item.title}
                    </HoveredLink>
                  ))}
                </div>
              </MenuItem>
              <MenuItem
                setActive={setActive}
                active={active}
                item={config.mainNav.products.title}
              >
                <div className="text-sm grid grid-cols-2 gap-6 p-2">
                  {config.mainNav.products.items.map((product) => (
                    <ProductItem key={product.href} {...product} />
                  ))}
                </div>
              </MenuItem>
              <MenuItem
                setActive={setActive}
                active={active}
                item={config.mainNav.lastGroup.title}
              >
                <div className="flex flex-col space-y-4 text-sm">
                  {config.mainNav.lastGroup.items.map((item) => (
                    <HoveredLink key={item.href} href={item.href}>
                      {item.title}
                    </HoveredLink>
                  ))}
                </div>
              </MenuItem>
            </div>

            {/* CTA Button */}
            {config.cta && (
              <div className="hidden md:block shrink-0">
                <Link
                  href={config.cta.href}
                  className="btn-shimmer text-black text-sm font-semibold px-5 py-2 rounded-full"
                >
                  {config.cta.text}
                </Link>
              </div>
            )}

            {/* Bouton Mobile (Menu Hamburger) */}
            <div className="shrink-0 md:hidden ml-auto">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-white p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Menu>
      </div>

      {/* Mobile Menu Overlay - Full Screen */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl md:hidden overflow-y-auto"
          >
            <div className="flex flex-col min-h-screen p-6">
              <div className="flex items-center justify-between mb-8">
                <Link href={config.logo.href} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  {config.logo.src && (
                    <CldImageSafe
                      src={config.logo.src}
                      alt={config.logo.alt}
                      width={config.logo.width || 32}
                      height={config.logo.height || 32}
                      className="h-8 w-auto rounded-md"
                    />
                  )}
                  {config.logo.text && (
                    <span className="font-bold text-lg text-white">
                      {config.logo.text}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-white/70 hover:text-white bg-white/5 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col space-y-8 flex-1">
                <div className="space-y-4">
                  <p className="text-[#F4C430] text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-2">
                    {config.mainNav.firstGroup.title}
                  </p>
                  <div className="flex flex-col space-y-3 pl-2">
                    {config.mainNav.firstGroup.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-xl font-medium text-white/90 hover:text-[#F4C430] transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[#F4C430] text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-2">
                    {config.mainNav.products.title}
                  </p>
                  <div className="flex flex-col space-y-3 pl-2">
                    {config.mainNav.products.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-xl font-medium text-white/90 hover:text-[#F4C430] transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[#F4C430] text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-2">
                    {config.mainNav.lastGroup.title}
                  </p>
                  <div className="flex flex-col space-y-3 pl-2">
                    {config.mainNav.lastGroup.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-xl font-medium text-white/90 hover:text-[#F4C430] transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {config.cta && (
                <div className="mt-8 pb-8">
                  <Link
                    href={config.cta.href}
                    className="block w-full btn-shimmer text-black text-lg font-bold px-6 py-4 rounded-xl text-center shadow-lg shadow-[#F4C430]/20"
                    onClick={() => setMobileOpen(false)}
                  >
                    {config.cta.text}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Menu({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className="relative rounded-full border border-[#F4C430]/20 bg-black/80 backdrop-blur-md shadow-2xl px-4 py-3 md:px-6 md:py-3"
    >
      {children}
    </nav>
  );
}

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <Link href={href} className="flex space-x-4 group">
      <CldImageSafe
        src={src}
        width={120}
        height={60}
        alt={title}
        className="shrink-0 rounded-md shadow-lg group-hover:scale-105 transition-transform duration-200 object-cover"
      />
      <div>
        <h4 className="text-base font-bold mb-1 text-white group-hover:text-[#F4C430] transition-colors">
          {title}
        </h4>
        <p className="text-gray-400 text-xs max-w-[10rem] leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode;
}) => {
  return (
    <Link
      {...(rest as LinkProps)}
      className="text-gray-400 hover:text-[#F4C430] transition-colors"
    >
      {children}
    </Link>
  );
};
