import React from 'react';
import Button from './Button';
import Select from './Select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange?: (limit: number) => void;
  indexOfFirstRecord: number;
  indexOfLastRecord: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  onRecordsPerPageChange,
  indexOfFirstRecord,
  indexOfLastRecord,
}) => {
  if (totalRecords === 0) return null;

  // Helper function to build compact page list with ellipsis like production apps
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 font-sans">
      {/* Records Info */}
      <div className="text-xs sm:text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-900">{indexOfFirstRecord}</span> to{' '}
        <span className="font-semibold text-slate-900">
          {Math.min(indexOfLastRecord, totalRecords)}
        </span>{' '}
        of <span className="font-semibold text-slate-900">{totalRecords}</span> records
      </div>

      {/* Page Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400 font-semibold select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-slate-950 text-white shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-650 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>

        {/* Limit Selector */}
        {onRecordsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Show:</span>
            <div className="w-16 text-left">
              <Select
                value={String(recordsPerPage)}
                placement="top"
                onChange={(val) => {
                  onRecordsPerPageChange(Number(val));
                  onPageChange(1);
                }}
                hClass="h-8 px-2"
                options={[10, 15, 25, 50, 100, 250, 500, 1000, 2500, 5000].map((limit) => ({
                  value: String(limit),
                  label: String(limit),
                }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
