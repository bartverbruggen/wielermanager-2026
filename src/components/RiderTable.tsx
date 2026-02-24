import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { useState, useMemo, memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronUp, ChevronDown, Bike, Trophy } from "lucide-react";

interface Rider {
  name: string;
  team: string;
  price: number;
  url: string;
  uci_rank: number;
  uci_pts: number;
  races: string[];
  [key: string]: unknown;
}

interface RaceInfo {
  name: string;
  start_date: string | null;
  is_uci_wt: boolean;
}

interface RiderTableProps {
  riders: Rider[];
  allRaces: string[];
  selectedRaces: Set<string>;
  raceMetadata?: Record<string, RaceInfo>;
}

// Memoize the table header component
const TableHeader = memo(
  ({
    headerGroup,
    raceMetadata,
  }: {
    headerGroup: any;
    raceMetadata?: Record<string, RaceInfo>;
  }) => (
    <tr>
      {headerGroup.headers.map((header: any, idx: number) => {
        const isSorted = header.column.getIsSorted();
        const canSort = header.column.getCanSort();
        const isFirstColumn = idx === 0;
        const raceName = header.column.columnDef.accessorKey as string;
        const raceInfo = raceMetadata?.[raceName];

        return (
          <th
            key={header.id}
            onClick={header.column.getToggleSortingHandler()}
            style={{ width: `${header.getSize()}px` }}
            className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 ${
              canSort ? "cursor-pointer hover:bg-gray-200" : ""
            } ${isFirstColumn ? "sticky left-0 z-20 bg-gray-100" : ""}`}
            title={
              raceInfo?.start_date
                ? `${raceName} - ${raceInfo.start_date}`
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              {flexRender(header.column.columnDef.header, header.getContext())}
              {raceInfo?.is_uci_wt && (
                <Trophy size={20} className="text-yellow-500" />
              )}
              {canSort && (
                <div className="w-4 h-4">
                  {isSorted === "asc" && <ChevronUp size={16} />}
                  {isSorted === "desc" && <ChevronDown size={16} />}
                </div>
              )}
            </div>
          </th>
        );
      })}
    </tr>
  ),
);

TableHeader.displayName = "TableHeader";

// Memoize the table row component
const TableRow = memo(({ row, idx }: { row: any; idx: number }) => (
  <tr
    className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
  >
    {row.getVisibleCells().map((cell: any, cellIdx: number) => {
      const isFirstColumn = cellIdx === 0;
      return (
        <td
          key={cell.id}
          style={{ width: `${cell.column.getSize()}px` }}
          className={`px-4 py-3 text-sm h-14 ${isFirstColumn ? "sticky left-0 z-10 bg-inherit" : ""}`}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    })}
  </tr>
));

TableRow.displayName = "TableRow";

export default function RiderTable({
  riders,
  allRaces,
  selectedRaces,
  raceMetadata,
}: RiderTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Parse date string to a comparable format
  const parseRaceDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date("9999-12-31"); // Put races without dates at the end
    try {
      // Try to parse various date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {}
    return new Date("9999-12-31");
  };

  // Memoize columns and prevent recreation unless allRaces changes significantly
  const columns = useMemo<ColumnDef<Rider>[]>(() => {
    const baseColumns: ColumnDef<Rider>[] = [
      {
        accessorKey: "name",
        header: "Rider",
        cell: (info) => {
          const rider = info.row.original;
          return (
            <a
              href={rider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {info.getValue<string>()}
            </a>
          );
        },
        size: 200,
      },
      {
        accessorKey: "team",
        header: "Team",
        size: 200,
      },
      {
        accessorKey: "uci_rank",
        header: "UCI Rank",
        size: 80,
      },
      {
        accessorKey: "price",
        header: "Price",
        size: 80,
        cell: (info) => `${info.getValue<number>()}M`,
      },
    ];

    // Add race columns - only for selected races or all if none selected
    let racesToShow =
      selectedRaces.size > 0 ? Array.from(selectedRaces) : allRaces;

    // Sort races by start_date from metadata
    if (raceMetadata) {
      racesToShow = racesToShow.sort((a, b) => {
        const dateA = parseRaceDate(raceMetadata[a]?.start_date);
        const dateB = parseRaceDate(raceMetadata[b]?.start_date);
        return dateA.getTime() - dateB.getTime();
      });
    } else {
      racesToShow = racesToShow.sort();
    }

    const raceColumns: ColumnDef<Rider>[] = racesToShow.map((race) => ({
      accessorKey: race,
      header: race,
      cell: (info) => {
        const rider = info.row.original;
        const isRiding = rider.races?.includes(race);
        return (
          <div className="flex items-center justify-center w-full">
            <Bike className={isRiding ? "text-green-500" : "text-gray-200"} />
          </div>
        );
      },
      size: 60,
    }));

    return [...baseColumns, ...raceColumns];
  }, [allRaces, selectedRaces, raceMetadata]);

  const table = useReactTable({
    data: riders,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // Setup virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56, // ~56px per row (h-14 = 56px)
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  const columnCount = table.getHeaderGroups()[0]?.headers.length || 0;
  const totalWidth = table.getTotalSize();

  if (riders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <p className="text-center text-gray-600">
          No riders match the selected races.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <div ref={tableContainerRef} className="overflow-auto grow">
        <table
          className="w-full border-collapse"
          style={{ width: `${totalWidth}px` }}
        >
          <thead className="bg-gray-100 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableHeader
                key={headerGroup.id}
                headerGroup={headerGroup}
                raceMetadata={raceMetadata}
              />
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td
                  colSpan={columnCount}
                  style={{ height: `${paddingTop}px` }}
                />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <TableRow key={row.id} row={row} idx={virtualRow.index % 2} />
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td
                  colSpan={columnCount}
                  style={{ height: `${paddingBottom}px` }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
