import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { MbaCategory } from "@/api/mba";
import { allThresholdRows, institutePath, pct, rowLabel } from "@/lib/mbaPublic";
import { TableWrap, Td, Th } from "./MbaPublicUi";

/**
 * Minimum CAT percentiles for one (category, PwD) group, one row per institute
 * programme (one per gender where the policy splits by gender). Rendered from
 * the build-time snapshot, so it is in the prerendered HTML.
 */
export default function ThresholdTable({
  category,
  pwd,
  caption,
}: {
  category: MbaCategory;
  pwd: boolean;
  caption: string;
}) {
  const rows = allThresholdRows(category, pwd);
  return (
    <TableWrap caption={caption}>
      <thead>
        <tr>
          <Th>Institute</Th>
          <Th>Policy batch</Th>
          <Th className="text-right">Overall</Th>
          <Th className="text-right">VARC</Th>
          <Th className="text-right">DILR</Th>
          <Th className="text-right">QA</Th>
          <Th>Official source</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const key = `${row.institute.slug}-${row.programCode}`;
          const name = (
            <Link to={institutePath(row.institute.slug)} className="font-semibold text-[#2F43F2] hover:underline">
              {rowLabel(row)}
            </Link>
          );
          const source = (
            <a
              href={row.source.url}
              target="_blank"
              rel="noopener noreferrer"
              title={row.source.title}
              className="text-[12px] text-slate-500 underline decoration-dotted underline-offset-2 hover:text-[#2F43F2]"
            >
              {row.institute.shortName} admission policy
            </a>
          );
          if (row.records.length === 0) {
            return (
              <tr key={key}>
                <Td>{name}</Td>
                <Td>{row.policyBatch}</Td>
                <Td className="text-slate-500">
                  <span className="block min-w-[180px]">
                    No minimum published for this group.
                    {row.institute.cutoffNotes ? ` ${row.institute.cutoffNotes}` : ""}
                  </span>
                </Td>
                <Td />
                <Td />
                <Td />
                <Td>{source}</Td>
              </tr>
            );
          }
          return (
            <Fragment key={key}>
              {row.records.map((r, i) => (
                <tr key={`${key}-${r.gender ?? "all"}`}>
                  <Td>
                    {i === 0 ? name : <span className="sr-only">{rowLabel(row)}</span>}
                    {r.gender && <span className="ml-1 text-[12px] text-slate-500">({r.gender})</span>}
                  </Td>
                  <Td>{r.policyBatch}</Td>
                  <Td className="text-right font-semibold tabular-nums">{pct(r.overall)}</Td>
                  <Td className="text-right tabular-nums">{pct(r.varc)}</Td>
                  <Td className="text-right tabular-nums">{pct(r.dilr)}</Td>
                  <Td className="text-right tabular-nums">{pct(r.qa)}</Td>
                  <Td>{i === 0 ? source : null}</Td>
                </tr>
              ))}
            </Fragment>
          );
        })}
      </tbody>
    </TableWrap>
  );
}
