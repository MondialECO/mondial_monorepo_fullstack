'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

export default function FigmaNewsletter() {
  const [role, setRole] = useState('creator');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]" id="brief">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        {/* Left Column: Heading & Description */}
        <div className="flex flex-col gap-3 sm:gap-4 max-w-[560px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            The Newsletter
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            The Mondial Brief
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            What we shipped, what broke, and what we learned building Europe&apos;s idea-to-funding
            path. Once a month. No growth-hacking.
          </p>
        </div>

        {/* Right Column: Subscription Card */}
        <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 shadow-sm w-full">
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 py-6 sm:py-8">
              <div className="w-12 h-12 rounded-full bg-[#00C896]/15 text-[#00A854] flex items-center justify-center">
                <Check size={24} strokeWidth={3} />
              </div>
              <h3 className="font-heading font-bold text-[18px] sm:text-[20px] text-[#070707]">
                You&apos;re on the list!
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] max-w-[340px] leading-[1.6]">
                Thank you for subscribing to The Mondial Brief. Look out for our next monthly
                dispatch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Role Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="newsletter-role" className="text-[12px] font-medium text-[#5E5E5E]">
                  I am a...
                </label>
                <select
                  id="newsletter-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.1)] text-[13px] sm:text-[14px] text-[#070707] focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/30"
                >
                  <option value="creator">Creator — I have an idea, or I&apos;m looking for one</option>
                  <option value="entrepreneur">Entrepreneur — Building a company</option>
                  <option value="investor">Investor — Looking for vetted dealflow</option>
                  <option value="provider">Service Provider — Offering professional services</option>
                </select>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="newsletter-email" className="text-[12px] font-medium text-[#5E5E5E]">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.1)] text-[13px] sm:text-[14px] text-[#070707] placeholder:text-[#8A8B8F] focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/30"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-[10px] bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[14px] sm:text-[15px] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/40 mt-1"
              >
                Subscribe
              </button>

              <p className="text-[11px] text-[#8A8B8F] text-center">
                Unsubscribe anytime. We never share your address.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
