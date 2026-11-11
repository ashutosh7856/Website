import { useMemo, useState } from "react";
import { Cite, TableWrap, Td, Th } from "@/components/mba-public/MbaPublicUi";
import { CAP_META, capRows } from "@/lib/mahCap";

type Column = "GOPENS" | "GOPENH" | "GOPENO";
const COLUMNS: { id: Column; label: string; detail: string }[] = [
  { id: "GOPENS", label: "OPEN · State level", detail: "State-level seats (GOPENS)" },
  { id: "GOPENH", label: "OPEN · Home university", detail: "Home-university seats (GOPENH)" },
  { id: "GOPENO", label: "OPEN · Other university", detail: "Other-than-home-university seats (GOPENO)" },
];

const fmt = (v: number | null) => (v === null ? "—" : v.toFixed(2));

/**
 * The State CET Cell's CAP round closing figures for MBA/MMS courses (OPEN
 * columns). Always labelled as MAH-MBA/MMS CET percentiles — they are not CAT
 * percentiles and must never be read as one.
 */
export default function CapCutoffTable({ citySlug, initialLimit = 25 }: { citySlug?: string; initialLimit?: number }) {
  const all = useMemo(() => capRows(citySlug), [citySlug]);
  const cities = useMemo(
    () => [...new Set(all.map((r) => r.city).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b)),
    [all],
  );
  const [column, setColumn] = useState<Column>("GOPENS");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((r) => (!city || r.city === city) && (!q || r.institute.toLowerCase().includes(q)))
      .filter((r) => r[column] !== null)
      .sort((a, b) => (b[column] ?? 0) - (a[column] ?? 0));
  }, [all, city, query, column]);
  const shown = showAll ? filtered : filtered.slice(0, initialLimit);

  if (!CAP_META || all.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-3 text-[13px]">
        <label className="flex min-w-0 max-w-full flex-col gap-1">
          <span className="font-medium text-slate-600">Seat column</span>
          <select
            value={column}
            onChange={(e) => setColumn(e.target.value as Column)}
            className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.detail}
              </option>
            ))}
          </select>
        </label>
        {!citySlug && (
          <label className="flex min-w-0 max-w-full flex-col gap-1">
            <span className="font-medium text-slate-600">City</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex min-w-0 max-w-full flex-col gap-1">
          <span className="font-medium text-slate-600">Institute</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
      </div>
      <TableWrap caption={`${CAP_META.round} closing MAH-MBA/MMS CET percentiles, ${CAP_META.academicYear}`}>
        <thead>
          <tr>
            <Th>Institute</Th>
            <Th>Course</Th>
            {!citySlug && <Th>City</Th>}
            {COLUMNS.map((c) => (
              <Th key={c.id} className={`text-right ${c.id === column ? "text-[#2F43F2]" : ""}`}>
                {c.label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={`${r.code}-${r.course}`}>
              <Td>
                <span className="font-medium">{r.institute}</span>
                {r.status && <span className="block text-[12px] text-slate-500">{r.status}</span>}
              </Td>
              <Td className="text-[13px]">{r.course}</Td>
              {!citySlug && <Td className="text-[13px]">{r.city ?? "—"}</Td>}
              {COLUMNS.map((c) => (
                <Td key={c.id} className={`text-right tabular-nums ${c.id === column ? "font-semibold" : "text-slate-600"}`}>
                  {fmt(r[c.id])}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </TableWrap>
      {filtered.length > initialLimit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 cursor-pointer text-[13.5px] font-semibold text-[#2F43F2] hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${filtered.length} courses`}
        </button>
      )}
      <p className="mt-3 text-[12.5px] leading-5 text-slate-500">
        <strong className="text-slate-700">MAH-MBA/MMS CET percentiles, not CAT.</strong> Each figure is the score of the
        last candidate allotted a seat in that column in {CAP_META.round} ({CAP_META.academicYear}), as printed by the{" "}
        {CAP_META.publisher}. {CAP_META.seatPool ? `${CAP_META.seatPool}. ` : ""}Later rounds close lower or higher, and a
        past closing figure does not guarantee a seat. <Cite source={CAP_META.source} />
      </p>
    </div>
  );
}
