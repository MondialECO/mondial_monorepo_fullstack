"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Concept", href: "#concept", active: true },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="w-full fixed top-6 left-0 z-50 flex justify-center px-4">
      {/* Container */}
      <div className="w-full max-w-[1200px] bg-white/70 backdrop-blur-md dark:bg-background/70 rounded-[16px] px-6 py-3 md:h-[60px] md:flex md:items-center md:justify-between">

        {/* Top Row - Logo and Mobile Button */}
        <div className="flex items-center justify-between md:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-primary rounded-[10px] flex items-center justify-center relative">
              <span className="absolute w-4 border-2 border-background rotate-[-29deg]" />
            </div>
            <span className="text-[16px] font-semibold text-foreground tracking-[-0.02em]">
              Mondial
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-lg text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Navigation and CTA - Desktop */}
        <div className="hidden md:flex items-center justify-end gap-8">
          {/* Navigation */}
          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                href={item.href}
                active={item.active}
              />
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-[36px] px-4 rounded-full text-foreground text-[13px] font-semibold hover:bg-muted transition-colors inline-flex items-center"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="h-[36px] px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity inline-flex items-center"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile Menu - Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-3 mt-4 pt-4 border-t border-border">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                href={item.href}
                active={item.active}
              />
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Link
                href="/login"
                className="w-full h-[36px] rounded-full text-foreground text-[13px] font-semibold hover:bg-muted transition-colors flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="w-full h-[36px] rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ================= NAV ITEM ================= */

interface NavItemProps {
  label: string;
  href: string;
  active?: boolean;
}

function NavItem({ label, href, active = false }: NavItemProps) {
  return (
    <Link href={href}>
      <span
        className={`px-3 py-2 text-[14px] font-medium rounded-[8px] transition-colors inline-block
        ${
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}