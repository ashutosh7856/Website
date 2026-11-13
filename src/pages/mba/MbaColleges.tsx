import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Plus, Search } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import InstituteDetailPanel from '@/components/mba/InstituteDetailPanel';
import EligibilityForm from '@/components/mba-public/EligibilityForm';
import EligibilityResults from '@/components/mba-public/EligibilityResults';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  mbaErrorMessage,
  mbaStatus,
  useEligibilityCheck,
  useMbaColleges,
  useMbaProgram,
  useMbaShortlist,
  useSaveShortlistItem,
  type CollegeKind,
  type CollegeSummary,
  type EligibilityResponse,
  type EligibilityStatus,
} from '@/api/mba';
import { useMbaShell } from '@/lib/mbaShellContext';
import { bucket, trackEvent } from '@/lib/analytics';
import {
  EMPTY_DRAFT,
  draftFromInput,
  loadLastEligibilityInput,
  saveLastEligibilityInput,
  validateDraft,
  type EligibilityDraft,
  type EligibilityErrors,
} from '@/lib/mbaEligibilityInput';
import { formatDay, formatInr, institutePath, isPublished } from '@/lib/mbaPublic';

const STATUS_CHIP: Record<EligibilityStatus, { label: string; cls: string }> = {
  meets_minimum: { label: 'Meets minimum', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unknown: { label: "Can't tell", cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  below_minimum: { label: 'Below minimum', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

/** Best status across an institute's programmes (meets > unknown > below). */
function statusBySlug(res: EligibilityResponse | null): Map<string, EligibilityStatus> {
  const rank: Record<EligibilityStatus, number> = { meets_minimum: 0, unknown: 1, below_minimum: 2 };
  const out = new Map<string, EligibilityStatus>();
  for (const r of res?.results ?? []) {
    const prev = out.get(r.slug);
    if (!prev || rank[r.status] < rank[prev]) out.set(r.slug, r.status);
  }
  return out;
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ShortlistButton({ slug, saved }: { slug: string; saved: boolean }) {
  const save = useSaveShortlistItem();
  const [error, setError] = useState<string | null>(null);
  if (saved) {
    return (
      <Link
        to="/mba/shortlist"
        className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 font-[Poppins] text-[12px] font-semibold"
      >
        <Check className="h-3.5 w-3.5" aria-hidden /> In shortlist
      </Link>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={save.isPending}
        onClick={() => {
          setError(null);
          save.mutate(
            { slug, status: 'interested', deadline: null, notes: null },
            {
              onSuccess: () => trackEvent('mba_shortlist_add', { location: 'mba_colleges' }),
              onError: (err) =>
                setError(
                  mbaStatus(err) === 409
                    ? 'Your shortlist is full (100 institutes).'
                    : mbaErrorMessage(err, 'Could not add it.'),
                ),
            },
          );
        }}
        className="btn-primary inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 font-[Poppins] text-[12px] font-semibold disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden /> {save.isPending ? 'Adding…' : 'Add to shortlist'}
      </button>
      {error && (
        <span role="alert" className="font-[Poppins] text-[11px] text-[var(--red-500)]">
          {error}
        </span>
      )}
    </span>
  );
}

const TYPE_LABEL: Record<string, string> = {
  private: 'Private',
  government: 'Government',
  deemed: 'Deemed university',
  'university department': 'University department',
};

function CollegeDetailsAction({ inst, onOpen }: { inst: CollegeSummary; onOpen: () => void }) {
  const cls = 'btn-secondary inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 font-[Poppins] text-[12px] font-semibold';
  if (inst.kind === 'iim') {
    return (
      <button type="button" onClick={onOpen} className={cls}>
        Details &amp; sources
      </button>
    );
  }
  const profile = institutePath(inst.slug);
  if (isPublished(profile)) {
    return (
      <Link to={profile} className={cls}>
        Details &amp; sources
      </Link>
    );
  }
  if (inst.sourceUrl) {
    return (
      <a href={inst.sourceUrl} target="_blank" rel="noopener noreferrer" className={cls}>
        Official page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    );
  }
  return null;
}

function InstituteCard({
  inst,
  status,
  saved,
  onOpen,
}: {
  inst: CollegeSummary;
  status: EligibilityStatus | undefined;
  saved: boolean;
  onOpen: () => void;
}) {
  const main = inst.programs[0];
  const kindLabel = inst.kind === 'iim' ? 'IIM' : (inst.type && TYPE_LABEL[inst.type]) || null;
  return (
    <article className="ss-panel flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="ss-display text-[16px] text-[var(--ink)]">{inst.shortName}</h3>
          <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
            {[inst.city, inst.state].filter(Boolean).join(', ')}
            {kindLabel && ` · ${kindLabel}`}
          </p>
        </div>
        {status && (
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 font-[Poppins] text-[11px] font-semibold ${STATUS_CHIP[status].cls}`}>
            {STATUS_CHIP[status].label}
          </span>
        )}
      </div>
      {main && (
        <dl className="grid grid-cols-2 gap-2 font-[Poppins] text-[12px]">
          <div>
            <dt className="text-[var(--neutral-500)]">{main.code ?? 'Programme'} fee</dt>
            <dd className="font-semibold text-[var(--ink)]">{formatInr(main.feeTotal)}</dd>
          </div>
          <div>
            <dt className="text-[var(--neutral-500)]">
              Median salary{main.salaryYear ? ` (${main.salaryYear})` : ''}
            </dt>
            <dd className="font-semibold text-[var(--ink)]">{formatInr(main.medianSalary)}</dd>
          </div>
        </dl>
      )}
      {inst.programs.length > 1 && (
        <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
          {inst.programs.length} programmes
          {inst.kind === 'iim' ? `: ${inst.programs.map((p) => p.code ?? p.name).join(', ')}` : ''}
        </p>
      )}
      {(inst.examsAccepted.length > 0 || inst.applicationDeadline) && (
        <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
          {inst.examsAccepted.length > 0 && `Accepts ${inst.examsAccepted.join(', ')}`}
          {inst.examsAccepted.length > 0 && inst.applicationDeadline && ' · '}
          {inst.applicationDeadline && `Applications close ${formatDay(inst.applicationDeadline) || inst.applicationDeadline}`}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <CollegeDetailsAction inst={inst} onOpen={onOpen} />
        <ShortlistButton slug={inst.slug} saved={saved} />
      </div>
    </article>
  );
}

function DetailDrawer({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const detail = useMbaProgram(slug);
  return (
    <Sheet open={!!slug} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white sm:max-w-[520px]">
        <SheetHeader className="px-5 pt-5">
          <SheetTitle className="font-[Poppins] text-[18px] text-[#0E1629]">
            {detail.data?.name ?? 'Institute details'}
          </SheetTitle>
          <SheetDescription className="font-[Poppins] text-[12px]">
            Official figures with their sources.
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-8">
          {detail.isPending ? (
            <Skeleton rows={3} />
          ) : detail.isError ? (
            <StateBlock
              tone="error"
              title="Couldn't load this institute"
              detail={mbaErrorMessage(detail.error)}
              action={{ label: 'Try again', onClick: () => void detail.refetch() }}
            />
          ) : (
            <>
              <InstituteDetailPanel inst={detail.data} />
              <div className="mt-6">
                <ShortlistButtonForDrawer slug={detail.data.slug} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShortlistButtonForDrawer({ slug }: { slug: string }) {
  const shortlist = useMbaShortlist();
  const saved = !!shortlist.data?.items.some((i) => i.slug === slug);
  return <ShortlistButton slug={slug} saved={saved} />;
}

export default function MbaColleges() {
  const { profile } = useMbaShell();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [kind, setKind] = useState<CollegeKind | ''>('');
  const q = useDebounced(query.trim(), 300);
  const filters = useMemo(
    () => ({ q: q || undefined, city: city || undefined, kind: kind || undefined }),
    [q, city, kind],
  );
  const list = useMbaColleges(filters);
  const shortlist = useMbaShortlist();
  const savedSlugs = useMemo(() => new Set(shortlist.data?.items.map((i) => i.slug)), [shortlist.data]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // "Your latest percentile inputs": the last check on this device (public tool
  // or here), else the target percentile from onboarding as a starting point.
  const [draft, setDraft] = useState<EligibilityDraft>(() => {
    const last = loadLastEligibilityInput();
    if (last) return draftFromInput(last);
    return profile?.targetPercentile != null
      ? { ...EMPTY_DRAFT, overall: String(profile.targetPercentile) }
      : EMPTY_DRAFT;
  });
  const [usingTarget] = useState(() => !loadLastEligibilityInput() && profile?.targetPercentile != null);
  const [errors, setErrors] = useState<EligibilityErrors>({});
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [showFull, setShowFull] = useState(false);
  const check = useEligibilityCheck();
  const statuses = useMemo(() => statusBySlug(result), [result]);

  const cities = list.data?.cities ?? [];
  const filtered = !!(q || city || kind);
  const clearFilters = () => {
    setQuery('');
    setCity('');
    setKind('');
  };

  const runCheck = () => {
    const { input, errors: found } = validateDraft(draft);
    setErrors(found);
    if (!input) return;
    saveLastEligibilityInput(input);
    check.mutate(input, {
      onSuccess: (data) => {
        setResult(data);
        trackEvent('mba_college_predictor_used', {
          tool: 'mba_app_eligibility',
          percentile_bucket: bucket(input.overall),
          results: data.counts.meets_minimum,
        });
      },
    });
  };


  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <SkyBanner
        eyebrow="Colleges"
        title="MBA colleges and official CAT minimums"
        lead="IIMs and other top B-schools: fees, intake and median salaries, each from the institute's own documents."
        aside={
          list.data ? (
            <span className="font-[Poppins] text-[12px] text-white/70">{list.data.total} colleges</span>
          ) : undefined
        }
      />

      <section className="ss-panel space-y-4 p-4 md:p-5" aria-labelledby="mba-eligibility-heading">
        <div>
          <h2 id="mba-eligibility-heading" className="ss-display text-[17px] text-[var(--ink)]">
            Check my eligibility
          </h2>
          <p className="mt-1 font-[Poppins] text-[12.5px] text-[var(--neutral-500)]">
            {usingTarget
              ? 'Pre-filled with your target percentile from onboarding. Replace it with a mock or real percentile.'
              : 'Pre-filled with the percentiles you last checked on this device.'}{' '}
            Compares against each IIM&rsquo;s published minimums &mdash; not cut-offs, and never a prediction.
          </p>
        </div>
        <EligibilityForm
          draft={draft}
          errors={errors}
          onChange={setDraft}
          onSubmit={runCheck}
          pending={check.isPending}
          submitLabel="Check my eligibility"
        />
        {check.isError && (
          <p role="alert" className="font-[Poppins] text-[12.5px] text-[var(--red-500)]">
            {mbaErrorMessage(check.error, 'Could not run the check.')}
          </p>
        )}
        {result && (
          <div className="space-y-3">
            <p className="font-[Poppins] text-[13px] text-[var(--neutral-700)]">
              <strong>{result.counts.meets_minimum}</strong> meet the minimum ·{' '}
              <strong>{result.counts.unknown}</strong> can&rsquo;t tell · <strong>{result.counts.below_minimum}</strong>{' '}
              below. Status chips are shown on the cards below.
            </p>
            <button
              type="button"
              onClick={() => setShowFull((v) => !v)}
              className="btn-secondary cursor-pointer px-3.5 py-2 font-[Poppins] text-[12px] font-semibold"
              aria-expanded={showFull}
            >
              {showFull ? 'Hide full result' : 'Show full result, methodology and limitations'}
            </button>
            {showFull && (
              <EligibilityResults
                response={result}
                renderActions={(r) => <ShortlistButton slug={r.slug} saved={savedSlugs.has(r.slug)} />}
              />
            )}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search institutes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, city or programme"
            className="w-full rounded-xl border border-[var(--borders-default)] bg-white py-2.5 pl-9 pr-3 font-[Poppins] text-[13px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
          />
        </label>
        <label className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          City
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2.5 text-[13px] font-normal text-[var(--ink)]"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          Type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as CollegeKind | '')}
            className="mt-1 block rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2.5 text-[13px] font-normal text-[var(--ink)]"
          >
            <option value="">IIMs and others</option>
            <option value="iim">IIMs only</option>
            <option value="other">Non-IIM colleges</option>
          </select>
        </label>
      </div>

      {list.isPending ? (
        <Skeleton rows={4} />
      ) : list.isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load institutes"
          detail={mbaErrorMessage(list.error)}
          action={{ label: 'Try again', onClick: () => void list.refetch() }}
        />
      ) : list.data.colleges.length === 0 ? (
        <StateBlock
          tone="empty"
          title={filtered ? 'No colleges match' : 'No colleges yet'}
          detail={filtered ? 'Try a different search, city or type.' : 'College data has not been published yet.'}
          action={filtered ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={list.isFetching}>
            {list.data.colleges.map((inst) => (
              <InstituteCard
                key={inst.slug}
                inst={inst}
                status={statuses.get(inst.slug)}
                saved={savedSlugs.has(inst.slug)}
                onOpen={() => setOpenSlug(inst.slug)}
              />
            ))}
          </div>
          <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">
            Every figure comes from the institute&rsquo;s own documents; &ldquo;Not published&rdquo; means we found no
            official number. Eligibility chips cover the IIMs&rsquo; published minimums only.
          </p>
        </>
      )}

      <DetailDrawer slug={openSlug} onClose={() => setOpenSlug(null)} />
    </div>
  );
}
