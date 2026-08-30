'use client';

import React from 'react';
import { Shield, Briefcase, Building2, Users2, Landmark, HelpCircle, Check } from 'lucide-react';

interface Step1Props {
  investorType: string;
  onChange: (type: string) => void;
}

const INVESTOR_TYPES = [
  {
    id: 'angel',
    title: 'Angel Investor',
    desc: 'High-net-worth individual deploying personal capital into early-stage companies.',
    icon: Shield,
  },
  {
    id: 'vc',
    title: 'VC / Venture Fund',
    desc: 'Institutional fund investing pooled LP capital into scalable startups.',
    icon: Briefcase,
  },
  {
    id: 'family_office',
    title: 'Family Office',
    desc: 'Private wealth management advisory firm serving ultra-high-net-worth families.',
    icon: Landmark,
  },
  {
    id: 'syndicate',
    title: 'Syndicate / SPV',
    desc: 'Lead investor pooling capital from accredited co-investors per deal.',
    icon: Users2,
  },
  {
    id: 'corporate',
    title: 'Corporate / Strategic Investor',
    desc: 'Corporation investing balance sheet capital for financial and strategic returns.',
    icon: Building2,
  },
  {
    id: 'other',
    title: 'Other Professional Investor',
    desc: 'Qualified institutional or accredited private investor not listed above.',
    icon: HelpCircle,
  },
];

export default function Step1Profile({ investorType, onChange }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Select Your Investor Classification
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose the classification that best represents your legal and operational investment structure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INVESTOR_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = investorType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all duration-150 relative ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="font-semibold text-slate-900 dark:text-white text-base">
                    {type.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {type.desc}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
