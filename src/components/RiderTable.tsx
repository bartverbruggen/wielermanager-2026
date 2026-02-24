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
import { ChevronUp, ChevronDown, Check } from "lucide-react";

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

interface RiderTableProps {
  riders: Rider[];
  allRaces: string[];
  selectedRaces: Set<string>;
}

// Memoize the table header component
const TableHeader = memo(({ headerGroup }: { headerGroup: any }) => (
  <tr>
    {headerGroup.headers.map((header: any) => {
      const isSorted = header.column.getIsSorted();
      const canSort = header.column.getCanSort();
      return (
        <th
          key={header.id}
          onClick={header.column.getToggleSortingHandler()}
          style={{ width: header.getSize() }}
          className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 ${
            canSort ? "cursor-pointer hover:bg-gray-200" : ""
          } ${header.column.columnDef.meta?.sticky ? "sticky left-0 bg-gray-100 z-10" : ""}`}
        >
          <div className="flex items-center gap-2">
            {flexRender(header.column.columnDef.header, header.getContext())}
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
));

TableHeader.displayName = "TableHeader";

// Memoize the table row component
const TableRow = memo(({ row, idx }: { row: any; idx: number }) => (
  <tr
    className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 h-14`}
  >
    {row.getVisibleCells().map((cell: any) => (
      <td
        key={cell.id}
        style={{ width: cell.column.getSize() }}
        className={`px-4 py-3 text-sm ${cell.column.columnDef.meta?.sticky ? "sticky left-0 bg-inherit" : ""}`}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    ))}
  </tr>
));

TableRow.displayName = "TableRow";

export default function RiderTable({
  riders,
  allRaces,
  selectedRaces,
}: RiderTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
        meta: { sticky: true },
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
    const racesToShow =
      selectedRaces.size > 0 ? Array.from(selectedRaces).sort() : allRaces;

    const raceColumns: ColumnDef<Rider>[] = racesToShow.map((race) => ({
      accessorKey: race,
      header: race,
      cell: (info) => {
        const rider = info.row.original;
        const isRiding = rider.races?.includes(race);
        return (
          <div className="flex items-center justify-center">
            <Check
              size={16}
              className={`${isRiding ? "text-green-500 " : "text-gray-100"}`}
            />
          </div>
        );
      },
      size: 60,
    }));

    return [...baseColumns, ...raceColumns];
  }, [allRaces, selectedRaces]);

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
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
      <div className="overflow-x-auto flex-shrink-0">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableHeader key={headerGroup.id} headerGroup={headerGroup} />
            ))}
          </thead>
        </table>
      </div>

      <div ref={tableContainerRef} className="overflow-y-auto flex-grow">
        <table className="w-full border-collapse">
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow, idx) => {
              const row = rows[virtualRow.index];
              return (
                <TableRow key={row.id} row={row} idx={virtualRow.index % 2} />
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
