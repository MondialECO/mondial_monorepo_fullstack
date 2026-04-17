'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Upload, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { saveIdeaDraftApi } from '../../../service/creator/dashboard';
import { CreateIdeaModel, IdeaFormState, IdeaStatus } from '@/types/creator/create-idea-model';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

import "react-quill-new/dist/quill.snow.css";

// Field Type Definition (this solves all the type errors)
type FormField =
  | {
    key: string;
    label: string;
    placeholder?: string;
    isRichText?: true;
  }
  | {
    key: string;
    label: string;
    type: 'select';
    options: Array<{ label: string; value: string }>;
  }
  | {
    key: string;
    label: string;
    type: 'number';
    placeholder?: string;
  };

// Section type
type FormSection = {
  id: number;
  title: string;
  fields: FormField[];
};


const formSections = [
  {
    id: 1,
    title: 'Concept Overview',
    fields: [
      {
        key: 'name',
        label: 'Project / Idea Name',
        placeholder: 'e.g. EcoTrack – Carbon Footprint Tracker',
      },
      {
        key: 'problem_statement',
        label: 'Problem Statement',
        placeholder: 'Describe the problem your idea solves...',
        isRichText: true,
      },
      {
        key: 'target_audience',
        label: 'Target Audience',
        placeholder: 'Who will use this product/service? (age, profession, needs...)',
        isRichText: true,
      },
      {
        key: 'existing_solutions',
        label: 'Existing Solutions & Their Limitations',
        placeholder: 'What solutions already exist? Why are they not good enough?',
        isRichText: true,
      },
    ],
  },

  {
    id: 2,
    title: 'Your Proposed Solution',
    fields: [
      {
        key: 'solution_description',
        label: 'Description of Your Solution',
        placeholder: 'Explain how your product/service works...',
        isRichText: true,
      },
      {
        key: 'stage',
        label: 'Current Stage',
        type: 'select',
        options: [
          { label: 'Idea (concept only)', value: 'idea' },
          { label: 'MVP (minimum viable product)', value: 'mvp' },
          { label: 'Beta (testing with real users)', value: 'beta' },
          { label: 'Live / Launched', value: 'live' },
          { label: 'Scaling (growing users/revenue)', value: 'scaling' },
        ],
      },
      {
        key: 'differentiation',
        label: 'What makes your solution different / better?',
        placeholder: 'Unique features, better price, better UX, new technology...',
        isRichText: true,
      },
      {
        key: 'client_benefits',
        label: 'Concrete Benefits for Users/Customers',
        placeholder: 'Save time, save money, better health, more fun...',
        isRichText: true,
      },
      {
        key: 'long_term_vision',
        label: 'Long-term Vision (3–5 years)',
        placeholder: 'Where do you see this project in 3–5 years?',
        isRichText: true,
      },
    ],
  },

  {
    id: 3,
    title: 'Market Analysis & Customer Insights',
    fields: [
      {
        key: 'primary_customer_segment',
        label: 'Primary Customer Segment',
        placeholder: 'e.g. Working parents 25–40 years old, small e-commerce businesses...',
        isRichText: true,
      },
      {
        key: 'geographic_target',
        label: 'Geographic Target',
        placeholder: 'e.g. Bangladesh, South Asia, Global...',
        isRichText: true,
      },
      {
        key: 'purchasing_behavior',
        label: 'Customer Purchasing Behavior',
        placeholder: 'How do they usually buy similar products? Online / offline / subscription...',
        isRichText: true,
      },
      {
        key: 'market_size',
        label: 'Estimated Market Size',
        placeholder: 'e.g. $2.5B globally by 2030, 1.2M potential users in BD...',
        isRichText: true,
      },
    ],
  },

  {
    id: 4,
    title: 'Business Model',
    fields: [
      {
        key: 'product_type',
        label: 'Product Type',
        type: 'select',
        options: [
          { label: 'Product (physical/digital)', value: 'product' },
          { label: 'Service', value: 'service' },
          { label: 'Product + Service', value: 'product & service' },
        ],
      },
      {
        key: 'planned_price',
        label: 'Planned Price / Pricing Model',
        placeholder: 'e.g. $9/month, $49 one-time, freemium...',
        isRichText: true,
      },
      {
        key: 'sales_channels',
        label: 'Main Sales Channels',
        placeholder: 'e.g. Website, App Store, Facebook/Instagram ads, local partners...',
        isRichText: true,
      },
      {
        key: 'startup_costs',
        label: 'Estimated Startup Costs',
        placeholder: 'e.g. $1,500 – $4,000 (development, marketing, legal...)',
        isRichText: true,
      },
      {
        key: 'revenue_12_months',
        label: '12-Month Revenue Target',
        placeholder: 'e.g. $30,000 – $80,000',
        isRichText: true,
      },
    ],
  },

  {
    id: 5,
    title: 'Operations & Execution',
    fields: [
      {
        key: 'startup_requirements',
        label: 'What do you need to start?',
        placeholder: 'Tools, software, team members, skills, budget...',
        isRichText: true,
      },
      {
        key: 'prototype_status',
        label: 'Do you already have a prototype?',
        type: 'select',
        options: [
          { label: 'Yes, I have a prototype', value: 'I Have' },
          { label: 'No, not yet', value: 'Haven’t' },
        ],
      },
      {
        key: 'main_risks',
        label: 'Main Risks & Challenges',
        placeholder: 'Technical, market, competition, legal, financial...',
        isRichText: true,
      },
    ],
  },

  {
    id: 6,
    title: 'Roadmap & Objectives',
    fields: [
      {
        key: 'goals_30_days',
        label: 'Next 30 Days Goals',
        placeholder: 'What do you want to achieve in the next month?',
        isRichText: true,
      },
      {
        key: 'targets_90_days',
        label: '90-Day Targets',
        placeholder: 'Key milestones for the next 3 months...',
        isRichText: true,
      },
      {
        key: 'objectives_12_months',
        label: '12-Month Objectives',
        placeholder: 'Main goals for the first year...',
        isRichText: true,
      },
    ],
  },

  {
    id: 7,
    title: 'Risks & Compliance',
    fields: [
      {
        key: 'regulatory_considerations',
        label: 'Regulatory / Compliance Considerations',
        placeholder: 'Any laws, licenses, data privacy rules (GDPR, etc.)...',
        isRichText: true,
      },
      {
        key: 'legal_risks',
        label: 'Legal or Ethical Risks',
        placeholder: 'Potential lawsuits, IP issues, ethical concerns...',
        isRichText: true,
      },
      {
        key: 'certifications_licenses',
        label: 'Required Certifications or Licenses',
        placeholder: 'e.g. Food safety, medical device cert, business license...',
        isRichText: true,
      },
    ],
  },

  {
    id: 8,
    title: 'Founder & Team',
    fields: [
      {
        key: 'business_name',
        label: 'Business / Brand Name',
        placeholder: 'Official or working name of the business',
      },
      {
        key: 'founder_role',
        label: 'Your Role in the Project',
        placeholder: 'e.g. Founder & CEO, Tech Lead, Product Designer...',
      },
      {
        key: 'experience_skills',
        label: 'Your Main Experience & Skills',
        placeholder: 'Relevant experience, skills, previous projects...',
        isRichText: true,
      },
      {
        key: 'prior_project_experience',
        label: 'Prior Project / Startup Experience',
        placeholder: 'Have you built anything before? What happened to it?',
        isRichText: true,
      },
      {
        key: 'weekly_time_available',
        label: 'Weekly Time Available',
        type: 'select',
        options: [
          { label: 'Less than 5 hours', value: 'less_than_5_hours' },
          { label: '5–10 hours', value: '5_to_10_hours' },
          { label: '10–20 hours', value: '10_to_20_hours' },
          { label: 'More than 20 hours', value: 'more_than_20_hours' },
        ],
      },
      {
        key: 'motivation_vision_statement',
        label: 'Motivation & Personal Vision',
        placeholder: 'Why are you passionate about this idea?',
        isRichText: true,
      },
    ],
  },

  {
    id: 9,
    title: 'Funding & Media',
    fields: [
      {
        key: 'amount_required',
        label: 'Funding Amount Required (USD)',
        type: 'number',
        placeholder: 'e.g. 5000',
      },
      {
        key: 'equity_percentage',
        label: 'Equity Offered (%)',
        type: 'number',
        placeholder: 'e.g. 12.5',
      },
    ],
  },
] as const;

export default function CreateProjectPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // const [formData, setFormData] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Partial<IdeaFormState>>({});

  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);
  // const [content, setContent] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [] }, { background: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  }), []);

  // ─── Build payload that matches CreateIdeaModel ───────────────────────
  const buildPayload = (overrideStatus?: IdeaStatus): CreateIdeaModel => ({
    id: ideaId ?? undefined,
    status: overrideStatus || 'DRAFT',

    name: formData.name || '',
    problem_statement: formData.problem_statement || '',
    target_audience: formData.target_audience || '',
    existing_solutions: formData.existing_solutions || '',

    solution_description: formData.solution_description || '',
    stage: (formData.stage as any) || '',
    differentiation: formData.differentiation || '',
    client_benefits: formData.client_benefits || '',
    long_term_vision: formData.long_term_vision || '',

    primary_customer_segment: formData.primary_customer_segment || '',
    geographic_target: formData.geographic_target || '',
    purchasing_behavior: formData.purchasing_behavior || '',
    market_size: formData.market_size || '',

    product_type: (formData.product_type as any) || '',
    planned_price: formData.planned_price || '',
    sales_channels: formData.sales_channels || '',
    startup_costs: formData.startup_costs || '',
    revenue_12_months: formData.revenue_12_months || '',

    startup_requirements: formData.startup_requirements || '',
    prototype_status: (formData.prototype_status as any) || '',
    main_risks: formData.main_risks || '',

    goals_30_days: formData.goals_30_days || '',
    targets_90_days: formData.targets_90_days || '',
    objectives_12_months: formData.objectives_12_months || '',

    regulatory_considerations: formData.regulatory_considerations || '',
    legal_risks: formData.legal_risks || '',
    certifications_licenses: formData.certifications_licenses || '',

    business_name: formData.business_name || '',
    founder_role: formData.founder_role || '',
    experience_skills: formData.experience_skills || '',
    prior_project_experience: formData.prior_project_experience || '',
    weekly_time_available: (formData.weekly_time_available as any) || '',
    motivation_vision_statement: formData.motivation_vision_statement || '',

    amount_required: Number(formData.amount_required) || 0,
    equity_percentage: Number(formData.equity_percentage) || 0,

    media: uploadedMedia,
    documents: uploadedDocs,
  });

  const saveDraft = async (status: IdeaStatus = 'DRAFT') => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const payload = buildPayload(status);
      const res = await saveIdeaDraftApi(payload);

      if (res.success && res.id && !ideaId) {
        setIdeaId(res.id);
      }

      return res;
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await saveDraft('DRAFT');
    setCurrentStep((s) => Math.min(s + 1, formSections.length - 1));
  };


  const handleFinalSubmit = async () => {
    const res = await saveDraft('SUBMITTED');
    if (res?.success) {
      alert('Idea submitted successfully!');
      // redirect('/dashboard') or show success page
    } else {
      alert('Submission failed: ' + (res?.message || 'Unknown error'));
    }
  };

  const handleFiles = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    if (!files) return;
    setter((prev) => [...prev, ...Array.from(files)]);
  };

  const removeFile = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };


  if (!mounted) return null;

  const currentSection = formSections[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === formSections.length - 1;


  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 grid grid-cols-1 lg:grid-cols-3">

      {/* LEFT SIDEBAR (1/3 FIXED) */}
      <aside className="lg:col-span-1 bg-slate-50 dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-800 
        p-8 h-screen sticky top-0 overflow-y-auto">

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Bring your idea to life.
        </h1>

        <div className="space-y-4">
          {formSections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentStep(index)}
              className={`w-full text-left transition ${currentStep === index
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <div className="flex gap-3">
                <span className="text-sm font-semibold">{index + 1}</span>
                <div>
                  <div className="text-sm font-semibold">{section.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {section.id === 1 && "Explain your core concept"}
                    {section.id === 2 && "Outline your solution"}
                    {section.id === 3 && "Analyze target market"}
                    {section.id === 4 && "Describe revenue model"}
                    {section.id === 5 && "Detail your execution"}
                    {section.id === 6 && "Lay out your timeline"}
                    {section.id === 7 && "Identify potential risks"}
                    {section.id === 8 && "Introduce the founder"}
                    {section.id === 9 && "Add equity, image, and docs"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* RIGHT CONTENT (2/3) */}
      <main className="lg:col-span-2 p-8 h-screen bg-white dark:bg-slate-900 overflow-y-auto flex justify-center">
        <div className="w-full max-w-4xl p-8">

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {currentSection.title}
          </h2>

          <div className="space-y-7">
            {currentSection.fields.map(field => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-semibold block mb-1">
                  {field.label}
                </label>

                {'isRichText' in field && field.isRichText ? (
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                    <ReactQuill
                      theme="snow"
                      value={(formData[field.key as keyof typeof formData] as string) || ''}
                      onChange={(val) => setFormData((prev) => ({ ...prev, [field.key]: val }))}
                      modules={modules}
                      placeholder={field.placeholder}
                      className="min-h-[140px] md:min-h-[160px]"
                    />
                  </div>
                ) : 'type' in field && field.type === 'select' ? (
                  <select
                    value={(formData[field.key as keyof typeof formData] as string) || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : 'type' in field && field.type === 'number' ? (
                  <input
                    type="number"
                    step="0.01"
                    placeholder={field.placeholder}
                    // value={formData[field.key as keyof typeof formData] ?? ''}
                    value={(formData[field.key as keyof typeof formData] as string | number | undefined) ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={(formData[field.key as keyof typeof formData] as string) || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
            ))}


            {isLast && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Upload Media</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* MEDIA PREVIEWS */}
                    {uploadedMedia.map((file, i) => (
                      <div
                        key={i}
                        className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        {file.type.startsWith("image") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(file)}
                            className="h-40 w-full object-cover"
                          />
                        )}

                        {/* Cover label */}
                        <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                          Cover
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeFile(i, setUploadedMedia)}
                          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* UPLOAD BOX */}
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        onChange={(e) =>
                          handleFiles(e.target.files, setUploadedMedia)
                        }
                      />
                      <span className="text-sm font-medium">Select Image or Video</span>
                      <span className="text-xs text-muted-foreground">
                        JPEG, JPG, MP4, 16:9, 30MB
                      </span>
                    </label>

                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Document Upload</h3>
                  {/* DOCUMENT DROP */}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      multiple
                      hidden
                      onChange={(e) =>
                        handleFiles(e.target.files, setUploadedDocs)
                      }
                    />
                    <span className="text-sm font-medium">
                      Choose a file & Upload here
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Only Upload PDF, 20MB
                    </span>
                  </label>

                  {/* DOCUMENT LIST */}
                  <div className="mt-4 space-y-2">
                    {uploadedDocs.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm"
                      >
                        <span>📄 {file.name}</span>

                        <button
                          onClick={() => removeFile(i, setUploadedDocs)}
                          className="text-slate-500 hover:text-red-500"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* NAVIGATION */}
          <div className="flex gap-4 mt-4 justify-between mt-8 py-5">
            <button
              disabled={isFirst || isSaving}
              onClick={() => setCurrentStep(s => s - 1)}
              className="px-4 py-2 border rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center"
            >
              <ChevronLeft className="inline w-4 h-4" /> Previous
            </button>

            {isLast ? (
              <button
                onClick={handleFinalSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center"
              >
                <Check className="w-4 h-4" /> Submit Idea
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
              >
                {isSaving ? 'Saving...' : 'Next'}
                <ChevronRight className="inline w-4 h-4" />
              </button>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
