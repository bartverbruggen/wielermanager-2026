import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import "./RiderTable.css";

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

export default function RiderTable({
  riders,
  allRaces,
  selectedRaces,
}: RiderTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
              className="rider-link"
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

    // Add race columns
    const raceColumns: ColumnDef<Rider>[] = allRaces.map((race) => ({
      accessorKey: race,
      header: race,
      cell: (info) => {
        const rider = info.row.original;
        const isRiding = rider.races?.includes(race);
        return (
          <div className="race-cell">
            <input
              type="checkbox"
              checked={isRiding || false}
              readOnly
              disabled
              className={isRiding ? "checked" : ""}
            />
          </div>
        );
      },
      size: 60,
    }));

    return [...baseColumns, ...raceColumns];
  }, [allRaces]);

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

  if (riders.length === 0) {
    return (
      <div className="rider-table-container">
        <div className="no-results">
          <p>No riders match the selected races.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rider-table-container">
      <div className="table-wrapper">
        <table className="rider-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th
                       key={header.id}
                       onClick={header.column.getToggleSortingHandler()}
                       style={{ width: header.getSize() }}
                       className={`${
                         header.column.getCanSort() ? "sortable" : ""
                       } ${isSorted ? `sorted-${isSorted}` : ""} ${
                         header.column.columnDef.meta?.sticky ? "sticky-column" : ""
                       }`}
                     >
                      <div className="header-content">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="sort-indicator">
                            {isSorted === "asc"
                              ? " ⬆"
                              : isSorted === "desc"
                                ? " ⬇"
                                : " ⬍"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
               {row.getVisibleCells().map((cell) => (
                   <td key={cell.id} style={{ width: cell.column.getSize() }} className={cell.column.columnDef.meta?.sticky ? "sticky-column" : ""}>
                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
                   </td>
                 ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
