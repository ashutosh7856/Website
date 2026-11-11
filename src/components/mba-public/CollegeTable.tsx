import { Link } from "react-router-dom";
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import { TableWrap, Td, Th } from "@/components/mba-public/MbaPublicUi";
import { NIRF, flagship, formatInr, institutePath, nirfFor } from "@/lib/mbaPublic";

/** "source" link after a figure. */
export function SrcLink({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} source`}
      className="ml-1 text-[11px] text-slate-400 underline decoration-dotted hover:text-[#2F43F2]"
    >
      source
    </a>
  );
}

type Column = "city" | "nirf" | "fee" | "salary" | "exams";

/**
 * The verified-profile table used across the MBA pages: every figure is the
 * flagship programme's, with a link to its official source.
 */
export default function CollegeTable({
  colleges,
  caption,
  columns = ["city", "nirf", "fee", "salary"],
}: {
  colleges: MbaCollege[];
  caption: string;
  columns?: Column[];
}) {
  const has = (c: Column) => columns.includes(c);
  return (
    <TableWrap caption={caption}>
      <thead>
        <tr>
          <Th>Institute</Th>
          {has("city") && <Th>City</Th>}
          {has("nirf") && <Th className="text-right">NIRF {NIRF?.year ?? ""}</Th>}
          {has("exams") && <Th>Exams accepted</Th>}
          {has("fee") && <Th className="text-right">Total fee</Th>}
          {has("salary") && <Th className="text-right">Median salary</Th>}
        </tr>
      </thead>
      <tbody>
        {colleges.map((c) => {
          const p = flagship(c);
          const nirf = nirfFor(c);
          return (
            <tr key={c.slug}>
              <Td>
                <Link to={institutePath(c.slug)} className="font-semibold text-[#2F43F2] hover:underline">
                  {c.shortName}
                </Link>
                {p && <span className="block text-[12px] text-slate-500">{p.code}</span>}
              </Td>
              {has("city") && <Td>{c.city ?? "—"}</Td>}
              {has("nirf") && <Td className="text-right tabular-nums">{nirf ? `#${nirf.rank}` : <span className="text-slate-400">Not in top 100</span>}</Td>}
              {has("exams") && (
                <Td className="text-[13px]">{c.acceptedExams.length ? c.acceptedExams.map((e) => e.toUpperCase()).join(", ") : "—"}</Td>
              )}
              {has("fee") && (
                <Td className="text-right tabular-nums">
                  {formatInr(p?.feeTotal)}
                  {p?.feeTotal ? <SrcLink url={p.feeSource?.url} label={`${c.shortName} fee`} /> : null}
                </Td>
              )}
              {has("salary") && (
                <Td className="text-right tabular-nums">
                  {p?.medianSalary ? (
                    <>
                      {formatInr(p.medianSalary)}
                      {p.medianSalaryYear ? <span className="text-slate-400"> ({p.medianSalaryYear})</span> : null}
                      <SrcLink url={p.salarySource?.url} label={`${c.shortName} salary`} />
                    </>
                  ) : (
                    "Not published"
                  )}
                </Td>
              )}
            </tr>
          );
        })}
      </tbody>
    </TableWrap>
  );
}
