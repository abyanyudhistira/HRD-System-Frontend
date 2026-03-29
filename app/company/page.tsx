'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopHeader } from '@/components/top-header';
import { TemplatesModal } from '@/components/templates-modal';
import { crawlerAPI, type Company } from '@/lib/api';
import { Building2, ChevronLeft, ChevronRight, Search, ArrowUpAZ, ArrowDownZA } from 'lucide-react';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE_DESKTOP = 10;
const ITEMS_PER_PAGE_MOBILE = 5;

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [sortField, setSortField] = useState<'name' | 'domain' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      try {
        const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;
        
        const response = await crawlerAPI.getCompanies({
          page: currentPage,
          per_page: itemsPerPage,
          search: searchQuery.trim() || undefined,
          sort: sortField,
          order: sortOrder,
        });
        
        setCompanies(response.companies.companies || []);
        setTotalPages(response.companies.pagination.total_pages);
        setTotalItems(response.companies.pagination.total_count);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, [currentPage, searchQuery, sortField, sortOrder, isMobile]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSort = (field: 'name' | 'domain' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;

  const handleViewRequirements = (company: Company) => {
    setSelectedCompany({ id: company.id, name: company.name });
  };

  return (
    <div className="flex h-screen bg-[#0f1419]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader />
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 md:px-20 md:py-8 xl:px-40 xl:py-16">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-white">Company</h1>
              <p className="mt-2 text-base text-gray-400">
                Manage your companies ({totalItems} total)
              </p>
            </div>

          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies by name or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-[#1a1f2e] py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleSort('name')}
                className={`flex items-center gap-2 rounded-lg border px-5 py-3 transition-colors ${
                  sortField === 'name'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-gray-700 bg-[#1a1f2e] text-gray-400 hover:border-gray-600'
                }`}
                title={`Sort by Name ${sortField === 'name' ? (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)') : ''}`}
              >
                {sortField === 'name' && sortOrder === 'asc' ? (
                  <ArrowUpAZ className="h-5 w-5" />
                ) : (
                  <ArrowDownZA className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">Name</span>
              </button>
              <button
                onClick={() => handleSort('domain')}
                className={`flex items-center gap-2 rounded-lg border px-5 py-3 transition-colors ${
                  sortField === 'domain'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-gray-700 bg-[#1a1f2e] text-gray-400 hover:border-gray-600'
                }`}
                title={`Sort by Domain ${sortField === 'domain' ? (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)') : ''}`}
              >
                {sortField === 'domain' && sortOrder === 'asc' ? (
                  <ArrowUpAZ className="h-5 w-5" />
                ) : (
                  <ArrowDownZA className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">Domain</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {Array.from({ length: itemsPerPage }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-700 bg-[#1a1f2e] p-5">
                  <div className="mb-5 flex h-12 w-12 animate-pulse rounded-lg bg-gray-700" />
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-700" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-700" />
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-gray-700 pt-4">
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-700" />
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-6 space-y-2">
                <div className="h-1 w-16 rounded-full bg-gray-700" />
                <div className="h-1 w-16 rounded-full bg-gray-700" />
                <div className="h-1 w-16 rounded-full bg-gray-700" />
              </div>
              <p className="text-lg text-gray-400">No companies found</p>
              <p className="mt-2 text-sm text-gray-500">Try adjusting your search</p>
            </div>
          ) : (
            <div className="flex flex-col min-h-[50vh]">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 animate-flip-in">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="shine-effect group relative rounded-xl border border-gray-700 bg-[#1a1f2e] p-5 transition-all hover:border-gray-600 hover:shadow-lg"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                      <Building2 className="h-6 w-6 text-blue-500" />
                    </div>

                    <h3 className="mb-2 text-base font-semibold text-white line-clamp-1">{company.name}</h3>
                    <p className="mb-2 text-sm text-gray-500">Code: {company.code}</p>
                    <p className="mb-3 text-sm text-gray-400 line-clamp-1">{company.domain}</p>

                    <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                      <span className="text-xs text-gray-500">
                        {new Date(company.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => handleViewRequirements(company)}
                        className="text-sm font-medium text-blue-500 transition-colors hover:text-blue-400"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - Always at bottom */}
              {totalPages > 1 && (
                <div className="mt-auto pt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-700 bg-[#1a1f2e] px-4 py-2 text-gray-400 transition-all hover:bg-gray-700 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[40px] rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                              : 'border border-gray-700 bg-[#1a1f2e] text-gray-400 hover:bg-gray-700 hover:border-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`min-w-[40px] rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            currentPage === totalPages
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                              : 'border border-gray-700 bg-[#1a1f2e] text-gray-400 hover:bg-gray-700 hover:border-gray-600'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-700 bg-[#1a1f2e] px-4 py-2 text-gray-400 transition-all hover:bg-gray-700 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </main>

      {selectedCompany && (
        <TemplatesModal
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          isOpen={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
