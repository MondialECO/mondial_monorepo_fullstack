"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full fixed top-6 left-0 z-50 flex justify-center px-4">
      {/* Container */}
      <div className="w-full max-w-[1200px] bg-white/70 backdrop-blur-md rounded-[16px] px-6 py-3 md:h-[60px] md:flex md:items-center md:justify-between">

        {/* Top Row - Logo and Mobile Button */}
        <div className="flex items-center justify-between md:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#3C61DD] rounded-[10px] flex items-center justify-center relative">
              {/* optional arrow decoration */}
              <span className="absolute w-4 border-2 border-[#F7F7F9] rotate-[-29deg]" />
            </div>

            <span className="text-[16px] font-normal text-[#3E3E3E] tracking-[-0.02em]">
              Mondial
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Navigation and CTA - Desktop */}
        <div className="hidden md:flex items-center justify-end gap-6">
          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <NavItem label="Concept" active />
            <NavItem label="Features" />
            <NavItem label="Pricing" />
            <NavItem label="FAQ" />
          </nav>

          {/* Button */}
          <button className="h-[36px] px-4 rounded-full bg-[#3C61DD] text-[13px] font-semibold text-white">
            Get Started
          </button>
        </div>

        {/* Mobile Menu - Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-[#e8e8e8]">
            <NavItem label="Concept" active />
            <NavItem label="Features" />
            <NavItem label="Pricing" />
            <NavItem label="FAQ" />
            <button className="w-full h-[36px] rounded-full bg-[#3C61DD] text-[13px] font-semibold text-white">
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ================= NAV ITEM ================= */

function NavItem({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <Link href="#">
      <span
        className={`px-2 py-1 text-[14px] font-medium rounded-[8px] transition
        ${active
            ? "bg-[#F1F1F2] text-[#5E5E5E]"
            : "text-[#5E5E5E] hover:bg-[#F1F1F2]"
          }`}
      >
        {label}
      </span>
    </Link>
  );
}