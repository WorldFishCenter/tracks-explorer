import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from '@tanstack/react-table';
import { getAllUsers, MongoUser } from '../api/authService';

interface BoatSelectionModalProps {
  onSelect: (imei: string) => void;
  onClose: () => void;
}

const BoatSelectionModal: React.FC<BoatSelectionModalProps> = ({ onSelect, onClose }) => {
  const { t } = useTranslation();
  const [boats, setBoats] = useState<MongoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columnHelper = createColumnHelper<MongoUser>();

  // Country color mapping
  const getCountryColor = (country: string | undefined): string => {
    const countryColors: Record<string, string> = {
      'Kenya': 'bg-success-subtle text-success',
      'Tanzania': 'bg-info-subtle text-info', 
      'Mozambique': 'bg-warning-subtle text-warning',
      'Zanzibar': 'bg-primary-subtle text-primary',
      'Egypt': 'bg-danger-subtle text-danger',
      'Malawi': 'bg-secondary-subtle text-secondary',
    };
    return countryColors[country || ''] || 'bg-light-subtle text-muted';
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('Boat', {
        id: 'boat',
        header: 'Vessel Name',
        cell: (info) => info.getValue() || 'Unknown',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('IMEI', {
        id: 'imei', 
        header: 'IMEI',
        cell: (info) => (
          <code className="text-muted small">{info.getValue()}</code>
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('captain', {
        id: 'captain',
        header: 'Captain',
        cell: (info) => info.getValue() || '-',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('vessel_type', {
        id: 'vesselType',
        header: 'Vessel Type',
        cell: (info) => info.getValue() || '-',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('Community', {
        id: 'community',
        header: 'Community',
        cell: (info) => info.getValue() || '-',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('Region', {
        id: 'region',
        header: 'Region',
        cell: (info) => info.getValue() || '-',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('Country', {
        id: 'country',
        header: 'Country',
        cell: (info) => {
          const country = info.getValue();
          return country ? (
            <span className={`badge rounded-pill ${getCountryColor(country)}`}>
              {country}
            </span>
          ) : (
            <span className="text-muted">-</span>
          );
        },
        filterFn: 'includesString',
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: boats,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  useEffect(() => {
    const loadBoats = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setBoats(data);
      } catch (err) {
        console.error('Error loading vessels:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBoats();
  }, []);

  const handleRowClick = (boat: MongoUser) => {
    onSelect(boat.IMEI);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">{t('navigation.selectBoat')}</h3>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
              </div>
            ) : (
              <div>
                {/* Search Input */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search vessels..."
                      value={globalFilter ?? ''}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                  </div>
                </div>

                {/* Results count */}
                <div className="mb-3">
                  <small className="text-muted">
                    Showing {table.getFilteredRowModel().rows.length} of {boats.length} vessels
                  </small>
                </div>

                {/* Table */}
                <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                  <table className="table table-hover table-striped">
                    <thead className="table-dark sticky-top">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className={`${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                              style={{ minWidth: '120px' }}
                            >
                              <div className="d-flex align-items-center justify-content-between">
                                <span>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                {header.column.getCanSort() && (
                                  <span className="ms-1">
                                    {{
                                      asc: <i className="ti ti-chevron-up"></i>,
                                      desc: <i className="ti ti-chevron-down"></i>,
                                    }[header.column.getIsSorted() as string] ?? (
                                      <i className="ti ti-selector text-muted"></i>
                                    )}
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRowClick(row.original)}
                          className="hover-bg-light"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {table.getRowModel().rows.length === 0 && (
                    <div className="text-center py-5">
                      <div className="text-muted">
                        <i className="ti ti-search-off fs-1"></i>
                        <p className="mt-2">{t('common.noResults')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoatSelectionModal;
