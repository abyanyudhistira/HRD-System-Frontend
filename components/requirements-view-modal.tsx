'use client';

import { X, User, MapPin, Calendar, Briefcase, Zap, GraduationCap, FileText } from 'lucide-react';

type Requirement = {
  id: string;
  type: string;
  label: string;
  value: string | number;
};

type RequirementsViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  requirements: any;
};

const typeIcons: Record<string, React.ElementType> = {
  gender: User,
  location: MapPin,
  age: Calendar,
  experience: Briefcase,
  skill: Zap,
  education: GraduationCap,
};

const typeBadgeColor: Record<string, string> = {
  gender: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  location: 'bg-green-500/10 text-green-400 border-green-500/20',
  age: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  experience: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  skill: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  education: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function RequirementsViewModal({ isOpen, onClose, templateName, requirements }: RequirementsViewModalProps) {
  if (!isOpen) return null;

  let requirementsList: Requirement[] = [];
  let position = '';

  if (requirements?.requirements && Array.isArray(requirements.requirements)) {
    requirementsList = requirements.requirements;
    position = requirements.position || '';
  } else if (Array.isArray(requirements)) {
    requirementsList = requirements;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-gray-700 bg-[#0f1419] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 bg-[#1a1f2e] px-6 py-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">{templateName}</h3>
            {position && <p className="text-sm text-gray-400 mt-0.5">{position}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #0f1419' }}>
          {requirementsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p>No requirements configured</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1f2e] border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Requirement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {requirementsList.map((req, index) => {
                  const Icon = typeIcons[req.type] || FileText;
                  const badgeClass = typeBadgeColor[req.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                  return (
                    <tr key={req.id} className="hover:bg-[#1a1f2e]/60 transition-colors">
                      <td className="px-6 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${badgeClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {req.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-200">{req.label}</td>
                      <td className="px-6 py-3 text-gray-400 font-mono text-xs">{String(req.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-3 flex-shrink-0 bg-[#1a1f2e]">
          <span className="text-xs text-gray-500">{requirementsList.length} requirements</span>
        </div>
      </div>
    </div>
  );
}
