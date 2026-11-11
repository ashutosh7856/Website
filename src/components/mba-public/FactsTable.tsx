import type { SourcedFact } from "@/data/mbaSnapshotTypes";
import { Cite, TableWrap, Td } from "@/components/mba-public/MbaPublicUi";

/** Key facts table: label, value, note, source. */
export default function FactsTable({ facts, caption }: { facts: SourcedFact[]; caption: string }) {
  return (
    <TableWrap caption={caption}>
      <tbody>
        {facts.map((f) => (
          <tr key={`${f.label}-${f.value}`}>
            <Td className="w-[220px] font-medium text-slate-600">{f.label}</Td>
            <Td>
              <span className="text-[#0E1629]">{f.value}</span>
              {f.tentative && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Tentative</span>
              )}
              {f.note && <span className="mt-1 block text-[12.5px] leading-5 text-slate-500">{f.note}</span>}
              <span className="mt-1 block">
                <Cite source={f.source} />
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

