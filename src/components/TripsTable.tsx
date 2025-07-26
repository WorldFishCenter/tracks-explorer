import React, { useMemo, useState } from 'react';
import { 
  useReactTable, 
  createColumnHelper, 
  getCoreRowModel, 
  getSortedRowModel, 
  flexRender, 
  SortingState,
  getPaginationRowModel,
  PaginationState
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Trip } from '../api/pelagicDataService';
import { 
  IconChevronUp, 
  IconChevronDown, 
  IconSelector, 
  IconChevronLeft, 
  IconChevronRight, 
  IconMaximize,
  IconMinimize,
  IconMap,
  IconLoader
} from '@tabler/icons-react';
import { formatDateTime, formatDurationFromSeconds, formatDistance } from '../utils/formatters';

interface TripsTableProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  loading?: boolean;
}

const TripsTable: React.FC<TripsTableProps> = ({ trips, onSelectTrip, loading = false }) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  
  const columnHelper = createColumnHelper<Trip>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: t('trips.tripId'),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('boatName', {
      header: t('trips.vesselName'),
      cell: info => info.getValue() || 'Unknown',
    }),
    columnHelper.accessor('community', {
      header: t('vessel.community'),
      cell: info => info.getValue() || 'Unknown',
    }),
    columnHelper.accessor('startTime', {
      header: t('trips.startTime'),
      cell: info => formatDateTime(new Date(info.getValue())),
      sortingFn: (rowA, rowB) => {
        return new Date(rowA.original.startTime).getTime() - new Date(rowB.original.startTime).getTime();
      }
    }),
    columnHelper.accessor('endTime', {
      header: t('trips.endTime'),
      cell: info => formatDateTime(new Date(info.getValue())),
      sortingFn: (rowA, rowB) => {
        return new Date(rowA.original.endTime).getTime() - new Date(rowB.original.endTime).getTime();
      }
    }),
    columnHelper.accessor('durationSeconds', {
      header: t('trips.duration'),
      cell: info => formatDurationFromSeconds(info.getValue()),
    }),
    columnHelper.accessor('distanceMeters', {
      header: t('trips.distance'),
      cell: info => formatDistance(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: t('trips.actions'),
      cell: info => (
        <button 
          className="btn btn-sm btn-primary" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click event
            onSelectTrip(info.row.original.id);
          }}
        >
          <IconMap size={16} className="me-1" />
          {t('trips.view')}
        </button>
      ),
    }),
  ], [onSelectTrip, t]);
  
  const table = useReactTable({
    data: trips,
    columns,
    state: {
      sorting,
      // Only apply pagination state when not expanded
      ...(expanded ? {} : { pagination }),
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    // Only apply pagination model when not expanded
    ...(expanded ? {} : { getPaginationRowModel: getPaginationRowModel() }),
  });
  
  // Function to render sort indicators
  const getSortIcon = (isSorted: boolean | string) => {
    if (!isSorted) return <IconSelector size={16} />;
    if (isSorted === 'desc') return <IconChevronDown size={16} />;
    return <IconChevronUp size={16} />;
  };
  
  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Reset pagination when toggling
    if (!expanded) {
      setPagination({
        pageIndex: 0,
        pageSize: trips.length, // Set page size to all trips when expanding
      });
    } else {
      setPagination({
        pageIndex: 0,
        pageSize: 5, // Reset to default page size when collapsing
      });
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">{t('common.fishingTrips')}</h3>
          <div className="card-actions">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          </div>
        </div>
        <div className="card-body d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
          <div className="empty" style={{ width: "100%" }}>
            <div className="empty-icon">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            </div>
            <p className="empty-title">{t('common.loadingFishingTripsData')}</p>
            <p className="empty-subtitle text-muted">
              {t('common.pleaseWaitWhileWeRetrieveTrips')}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (trips.length === 0) {
    return (
      <div className="empty">
        <p className="empty-title">{t('common.noTripsFound')}</p>
        <p className="empty-subtitle text-muted">
          {t('common.noTripsMessage')}
        </p>
      </div>
    );
  }
  
  return (
    <div className="card mb-3">
      <div className="card-header">
        <h3 className="card-title">{t('common.fishingTrips')}</h3>
        <div className="card-actions">
          <button 
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={toggleExpanded}
            title={expanded ? t('common.showLess') : t('common.showAll')}
          >
            {expanded ? (
              <>
                <IconMinimize size={16} className="me-1" />
                {t('common.showLess')}
              </>
            ) : (
              <>
                <IconMaximize size={16} className="me-1" />
                {t('common.showAll')} ({trips.length})
              </>
            )}
          </button>
          <span className="text-muted small">{trips.length} {t('trips.title').toLowerCase()} {t('common.found')}</span>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-vcenter card-table table-striped">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="d-flex align-items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      
                      {header.column.getCanSort() && (
                        <span className="ms-1">
                          {getSortIcon(header.column.getIsSorted())}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                className="cursor-pointer"
                onClick={() => onSelectTrip(row.original.id)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination - Only show when not expanded */}
      {!expanded && trips.length > pagination.pageSize && (
        <div className="card-footer d-flex align-items-center">
          <p className="m-0 text-muted">
            {t('common.showing')} <span>{table.getState().pagination?.pageIndex * table.getState().pagination?.pageSize + 1}</span> {t('common.to')}{" "}
            <span>
              {Math.min(
                (table.getState().pagination?.pageIndex + 1) * table.getState().pagination?.pageSize,
                trips.length
              )}
            </span> {t('common.of')} <span>{trips.length}</span> {t('common.entries')}
          </p>
          <ul className="pagination m-0 ms-auto">
            <li className={`page-item ${!table.getCanPreviousPage() ? "disabled" : ""}`}>
              <button 
                className="page-link" 
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft size={16} />
                {t('common.previous')}
              </button>
            </li>
            
            {/* First few pages */}
            {Array.from(
              { length: Math.min(3, table.getPageCount()) },
              (_, i) => i
            ).map((pageIndex) => (
              <li 
                key={pageIndex} 
                className={`page-item ${pageIndex === table.getState().pagination?.pageIndex ? "active" : ""}`}
              >
                <button 
                  className="page-link" 
                  onClick={() => table.setPageIndex(pageIndex)}
                >
                  {pageIndex + 1}
                </button>
              </li>
            ))}
            
            {/* Ellipsis if many pages */}
            {table.getPageCount() > 3 && table.getState().pagination?.pageIndex < table.getPageCount() - 3 && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}
            
            {/* Last page if many pages */}
            {table.getPageCount() > 3 && (
              <li 
                className={`page-item ${table.getState().pagination?.pageIndex === table.getPageCount() - 1 ? "active" : ""}`}
              >
                <button 
                  className="page-link" 
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                >
                  {table.getPageCount()}
                </button>
              </li>
            )}
            
            <li className={`page-item ${!table.getCanNextPage() ? "disabled" : ""}`}>
              <button 
                className="page-link" 
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {t('common.next')}
                <IconChevronRight size={16} />
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TripsTable; 