import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (totalItems <= pageSize && currentPage === 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderTop: '1px solid var(--border)',
        backgroundColor: '#fafbfc',
        fontSize: '13px',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      <div>
        Showing <strong style={{ color: 'var(--text-main)' }}>{startItem}</strong> to <strong style={{ color: 'var(--text-main)' }}>{endItem}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{
            padding: '4px 8px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 7) return true;
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - currentPage) <= 1;
            })
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) {
                acc.push('...');
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, index) => {
              if (item === '...') {
                return (
                  <span key={`dots-${index}`} style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>
                    ...
                  </span>
                );
              }
              const isCurrent = item === currentPage;
              return (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  style={{
                    minWidth: '28px',
                    height: '28px',
                    padding: '0 6px',
                    borderRadius: '4px',
                    border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isCurrent ? 'var(--primary)' : '#ffffff',
                    color: isCurrent ? '#ffffff' : 'var(--text-main)',
                    fontWeight: isCurrent ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item}
                </button>
              );
            })}
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={{
            padding: '4px 8px',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
