import React, { useMemo, useState } from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  PaginationState,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Trip } from '../api/pelagicDataService';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Maximize,
  Minimize,
  Map,
  Loader2
} from 'lucide-react';
import { formatDateTime, formatDurationFromSeconds, formatDistance } from '../utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  
  const columns = useMemo<ColumnDef<Trip>[]>(() => [
    {
      accessorKey: 'boatName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 -ml-2"
          >
            {t('trips.vesselName')}
            {column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('boatName') || 'Unknown'}</div>
      ),
    },
    {
      accessorKey: 'community',
      header: t('vessel.community'),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue('community') || 'Unknown'}</div>
      ),
    },
    {
      accessorKey: 'startTime',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 -ml-2"
          >
            {t('trips.startTime')}
            {column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-sm">{formatDateTime(new Date(row.getValue('startTime')))}</div>
      ),
    },
    {
      accessorKey: 'durationSeconds',
      header: t('trips.duration'),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {formatDurationFromSeconds(row.getValue('durationSeconds'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'distanceMeters',
      header: t('trips.distance'),
      cell: ({ row }) => (
        <div className="text-sm">{formatDistance(row.getValue('distanceMeters'))}</div>
      ),
    },
    {
      id: 'actions',
      header: t('trips.actions'),
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTrip(row.original.id);
          }}
        >
          <Map className="mr-1 h-4 w-4" />
          {t('trips.view')}
        </Button>
      ),
    },
  ], [onSelectTrip, t]);
  
  const table = useReactTable({
    data: trips,
    columns,
    state: {
      sorting,
      ...(expanded ? {} : { pagination }),
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(expanded ? {} : { getPaginationRowModel: getPaginationRowModel() }),
  });
  
  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setPagination({
        pageIndex: 0,
        pageSize: trips.length,
      });
    } else {
      setPagination({
        pageIndex: 0,
        pageSize: 5,
      });
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.fishingTrips')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold">{t('common.loadingFishingTripsData')}</p>
            <p className="text-sm text-muted-foreground">
              {t('common.pleaseWaitWhileWeRetrieveTrips')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-lg font-semibold">{t('common.noTripsFound')}</p>
            <p className="text-sm text-muted-foreground">
              {t('common.noTripsMessage')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('common.fishingTrips')}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleExpanded}
              className="h-8"
            >
              {expanded ? (
                <>
                  <Minimize className="mr-1 h-4 w-4" />
                  {t('common.showLess')}
                </>
              ) : (
                <>
                  <Maximize className="mr-1 h-4 w-4" />
                  {t('common.showAll')} ({trips.length})
                </>
              )}
            </Button>
            <Badge variant="secondary" className="text-xs">
              {trips.length} {t('trips.title').toLowerCase()} {t('common.found')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectTrip(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('common.noTripsFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination - Only show when not expanded */}
        {!expanded && trips.length > pagination.pageSize && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {t('common.showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} {t('common.to')}{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                trips.length
              )}{' '}
              {t('common.of')} {trips.length} {t('common.entries')}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripsTable; 