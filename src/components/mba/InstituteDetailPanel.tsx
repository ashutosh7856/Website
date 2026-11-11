import { ExternalLink } from 'lucide-react';
import { MBA_CATEGORIES, type InstituteDetail } from '@/api/mba';
import { Cite, ThresholdCell } from '@/components/mba-public/MbaPublicUi';
import { formatDay, formatInr, programsWithCutoffs, thresholdRows } from '@/lib/mbaPublic';

/**
 * GET /mba/programs/{slug}, laid out for the student app's detail drawer:
 * programme facts with their official sources, the minimum CAT percentiles by
 * category, and the data's freshness.
 */
export default function InstituteDetailPanel({ inst }: { inst: InstituteDetail }) {
  const codes = programsWithCutoffs(inst);
  return (
    <div className="space-y-6 font-[Poppins] text-[13px] text-slate-700">
      <div>
        <p className="text-[12px] text-slate-500">{[inst.city, inst.state].filter(Boolean).join(', ')}</p>
        {inst.website && (
          <a
            href={inst.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#6C4CF1] hover:underline"
          >
            Official website <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>

      <section className="space-y-4">
        <h3 className="text-[14px] font-bold text-[#0E1629]">Programmes</h3>
        {inst.programs.map((p) => (
          <div key={p.code} className="rounded-xl border border-slate-200 p-3.5">
            <p className="font-semibold text-[#0E1629]">{p.name}</p>
            <dl className="mt-2 space-y-2.5">
              {[
                { label: 'Total fee', value: formatInr(p.feeTotal), note: p.feeNote, source: p.feeSource },
                {
                  label: 'Intake',
                  value: p.intake === null ? 'Not published' : `${p.intake} seats`,
                  note: p.intakeNote,
                  source: p.intakeSource,
                },
                {
                  label: `Median salary${p.medianSalaryYear ? ` (${p.medianSalaryYear})` : ''}`,
                  value: p.medianSalary === null ? 'Not published' : `${formatInr(p.medianSalary)} / year`,
                  note: p.salaryNote,
                  source: p.salarySource,
                },
              ].map((f) => (
                <div key={f.label}>
                  <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">{f.label}</dt>
                  <dd>
                    <span className="font-semibold text-[#0E1629]">{f.value}</span>
                    {f.note && <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{f.note}</span>}
                    {f.source && (
                      <span className="mt-0.5 block">
                        <Cite source={f.source} />
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-[14px] font-bold text-[#0E1629]">Minimum CAT percentiles</h3>
        <p className="text-[12px] leading-5 text-slate-500">
          Published minimums for the first shortlisting stage &mdash; not cut-offs. Overall in bold, then VARC / DILR /
          QA.
        </p>
        {codes.length === 0 && <p>{inst.cutoffNotes ?? 'No official minimums on record.'}</p>}
        {codes.map((code) => {
          const nonPwd = MBA_CATEGORIES.map((c) => thresholdRows(inst, c.id, false).find((r) => r.programCode === code)!);
          const pwd = MBA_CATEGORIES.map((c) => thresholdRows(inst, c.id, true).find((r) => r.programCode === code)!);
          return (
            <div key={code}>
              {codes.length > 1 && <p className="mb-1 font-semibold text-[#0E1629]">{code}</p>}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-2">Category</th>
                      <th scope="col" className="px-3 py-2">Non-PwD</th>
                      <th scope="col" className="px-3 py-2">PwD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MBA_CATEGORIES.map((c, i) => (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">{c.label}</td>
                        <td className="px-3 py-2">
                          <ThresholdCell records={nonPwd[i].records} />
                        </td>
                        <td className="px-3 py-2">
                          <ThresholdCell records={pwd[i].records} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-[12px] text-slate-500">
                Policy batch {nonPwd[0].policyBatch}. <Cite source={nonPwd[0].source} />
              </p>
            </div>
          );
        })}
        {inst.cutoffNotes && codes.length > 0 && <p className="text-[12px] leading-5 text-slate-500">{inst.cutoffNotes}</p>}
      </section>

      <section className="space-y-2">
        <h3 className="text-[14px] font-bold text-[#0E1629]">Sources</h3>
        <ul className="space-y-1 text-[12px]">
          {inst.sources.map((s) => (
            <li key={`${s.url}-${s.title}`}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 underline decoration-dotted underline-offset-2">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] text-slate-500">
          {inst.dataFreshness.note}
          {inst.dataFreshness.retrievedAt ? ` Retrieved ${formatDay(inst.dataFreshness.retrievedAt)}.` : ''}
        </p>
      </section>
    </div>
  );
}
