'use client';

import { useState } from 'react';
import {
  FolderOpen,
  File,
  FileText,
  Lock,
  Share2,
  Download,
  MoreVertical,
  Search,
  Upload,
  Home,
  Briefcase,
  DollarSign,
  Lightbulb,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const DOCUMENT_CATEGORIES = [
  { id: 'all', name: 'All Documents', icon: Home, count: 24 },
  { id: 'legal', name: 'Legal Documents', icon: Briefcase, count: 6 },
  { id: 'financial', name: 'Financial Records', icon: DollarSign, count: 8 },
  { id: 'ip', name: 'IP & Patents', icon: Lightbulb, count: 4 },
  { id: 'team', name: 'Team Information', icon: Users, count: 6 },
];

const DOCUMENTS = [
  { id: 1, name: 'Articles of Incorporation', category: 'legal', date: '2024-01-15', size: '245 KB', shared: false, verified: true },
  { id: 2, name: 'Cap Table - Latest', category: 'legal', date: '2024-05-10', size: '180 KB', shared: true, verified: true },
  { id: 3, name: 'Y2023 Financial Statements', category: 'financial', date: '2024-03-20', size: '1.2 MB', shared: false, verified: true },
  { id: 4, name: 'Tax Returns 2023', category: 'financial', date: '2024-04-01', size: '856 KB', shared: false, verified: true },
  { id: 5, name: 'Patent Application - Core Tech', category: 'ip', date: '2024-02-28', size: '542 KB', shared: true, verified: true },
  { id: 6, name: 'Trademark Registrations', category: 'ip', date: '2024-01-10', size: '320 KB', shared: false, verified: true },
  { id: 7, name: 'Team Bios & CVs', category: 'team', date: '2024-05-05', size: '2.1 MB', shared: true, verified: true },
  { id: 8, name: 'Org Chart', category: 'team', date: '2024-04-15', size: '156 KB', shared: false, verified: false },
  { id: 9, name: 'Q1 2024 Financial Report', category: 'financial', date: '2024-05-01', size: '678 KB', shared: true, verified: true },
];

function Phase6PageContent() {
  const { progress } = useEntrepreneurProgress();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!progress) return null;

  const filteredDocs = DOCUMENTS.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = searchQuery === '' || doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Data Room</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Secure document vault for investor due diligence</p>
          </div>
          <Button className="gap-2 ml-4 whitespace-nowrap">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Document</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sticky top-24 space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-5 px-2 py-2">Categories</h3>
              {DOCUMENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isSelected
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-neutral-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-neutral-5'}`} />
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-neutral-1'}`}>
                        {cat.name}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-neutral-5'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}

              <div className="pt-4 border-t-2 border-neutral-2 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Security
                  </p>
                  <p className="text-xs text-blue-800">
                    All documents are encrypted with AES-256 and access is tracked in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Search and Filter */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-neutral-5" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Document Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Documents', value: '24', color: 'bg-primary/10 text-primary' },
                { label: 'Verified', value: '23', color: 'bg-green-100 text-green-700' },
                { label: 'Shared Access', value: '8', color: 'bg-blue-100 text-blue-700' },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.color} border-2 border-current rounded-lg p-4`}>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Documents List */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-neutral-2">
                <h3 className="font-bold text-neutral-1">
                  {selectedCategory === 'all' ? 'All Documents' : DOCUMENT_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </h3>
                <p className="text-sm text-neutral-5 mt-1">{filteredDocs.length} documents</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-2 bg-neutral-50">
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Document Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Size</th>
                      <th className="px-4 py-3 text-center font-semibold text-neutral-1">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-neutral-1">Access</th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length > 0 ? (
                      filteredDocs.map((doc, idx) => (
                        <tr
                          key={doc.id}
                          className={idx !== filteredDocs.length - 1 ? 'border-b border-neutral-2' : ''}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                              <div>
                                <p className="font-medium text-neutral-1">{doc.name}</p>
                                <p className="text-xs text-neutral-5 mt-0.5">{doc.size}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-neutral-5">{doc.date}</td>
                          <td className="px-4 py-4 text-neutral-5">{doc.size}</td>
                          <td className="px-4 py-4 text-center">
                            {doc.verified ? (
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600 font-semibold">Verified</span>
                              </div>
                            ) : (
                              <span className="text-xs text-yellow-600 font-semibold">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {doc.shared ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                Shared
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-5">
                                Private
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button className="p-2 hover:bg-neutral-100 rounded-lg transition">
                              <MoreVertical className="w-4 h-4 text-neutral-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <p className="text-neutral-5 text-sm">No documents found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Access Control Section */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Access Control
                </h3>
                <Button size="sm" variant="outline" className="gap-2">
                  <Users className="w-4 h-4" />
                  Manage Access
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  { email: 'investor@example.com', access: 'View Only', added: '2024-05-15' },
                  { email: 'advisor@example.com', access: 'View Only', added: '2024-05-10' },
                  { email: 'team@example.com', access: 'Can Edit', added: '2024-04-20' },
                ].map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-2">
                    <div>
                      <p className="font-medium text-neutral-1">{user.email}</p>
                      <p className="text-xs text-neutral-5 mt-0.5">Added {user.added}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {user.access}
                      </span>
                      <button className="p-2 hover:bg-neutral-200 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-neutral-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4 gap-2">
                <Users className="w-4 h-4" />
                Add New User
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Phase6Page() {
  return (
    <RouteGuard requiredPhase={6}>
      <Phase6PageContent />
    </RouteGuard>
  );
}
