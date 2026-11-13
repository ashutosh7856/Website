import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Headset, MessagesSquare, PenLine, Search } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton, StateBlock } from '@/components/mba/ui';
import { GroupChip, ItemCard, Pill } from '@/components/mba/GdpiFeedback';
import { formatDate } from '@/components/mba/format';
import { mbaErrorMessage } from '@/api/mba';
import {
  BACKGROUNDS,
  PI_GROUPS,
  TOPIC_GROUPS,
  useGdpiItems,
  useGdpiSessions,
  type Background,
  type GdpiKind,
} from '@/api/mbaGdpi';

type Tab = GdpiKind | 'history';
const TABS: { id: Tab; label: string }[] = [
  { id: 'pi', label: 'PI questions' },
  { id: 'wat', label: 'WAT topics' },
  { id: 'gd', label: 'GD topics' },
  { id: 'history', label: 'My sessions' },
];
/** Cards rendered at once; "Show more" adds another page. */
const PAGE = 20;
const isTab = (v: string | null): v is Tab => TABS.some((t) => t.id === v);

function Bank({ kind }: { kind: GdpiKind }) {
  const [group, setGroup] = useState<string | undefined>();
  const [background, setBackground] = useState<Background | undefined>();
  const [search, setSearch] = useState('');
  // Paging resets whenever the filters change.
  const filterKey = `${group}|${background}|${search}`;
  const [paging, setPaging] = useState({ key: '', n: PAGE });
  const shown = paging.key === filterKey ? paging.n : PAGE;
  const { data, isPending, isError, error, refetch } = useGdpiItems({ kind });
  const groups = kind === 'pi' ? PI_GROUPS : TOPIC_GROUPS;

  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.items ?? []).filter(
      (item) =>
        (!group || item.group === group) &&
        (!background || item.background === null || item.background === background) &&
        (!needle || item.prompt.toLowerCase().includes(needle)),
    );
  }, [data, group, background, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Pill active={!group} onClick={() => setGroup(undefined)}>
          All
        </Pill>
        {groups.map((g) => (
          <Pill key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label}
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative block min-w-0 flex-1 basis-[220px]">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={kind === 'pi' ? 'Search questions' : 'Search topics'}
            className="block w-full rounded-xl border border-[var(--borders-default)] bg-white py-2 pr-3 pl-9 font-[Poppins] text-[13px] text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]"
          />
        </label>
        {kind === 'pi' && (
          <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
            My background
            <select
              value={background ?? ''}
              onChange={(e) => setBackground((e.target.value || undefined) as Background | undefined)}
              className="mt-1 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 text-[13px] text-[var(--ink)]"
            >
              <option value="">All backgrounds</option>
              {BACKGROUNDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isPending ? (
        <Skeleton rows={4} />
      ) : isError ? (
        <StateBlock
          tone="error"
          title="Couldn't load the question bank"
          detail={mbaErrorMessage(error)}
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : items.length === 0 ? (
        <StateBlock
          tone="empty"
          title={data.items.length ? 'Nothing matches these filters' : 'Coming soon'}
          detail={data.items.length ? 'Try another group or clear the search.' : 'This bank is being prepared.'}
        />
      ) : (
        <>
          <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
            {items.length} {kind === 'pi' ? 'questions' : 'topics'}
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {items.slice(0, shown).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                action={
                  kind === 'wat' ? (
                    <Link
                      to={`/mba/gdpi/wat?topic=${encodeURIComponent(item.id)}`}
                      className="btn-primary px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
                    >
                      Write on this
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </div>
          {items.length > shown && (
            <button
              type="button"
              onClick={() => setPaging({ key: filterKey, n: shown + PAGE })}
              className="btn-secondary mx-auto block cursor-pointer px-5 py-2.5 font-[Poppins] text-[13px] font-semibold"
            >
              Show more ({items.length - shown} left)
            </button>
          )}
        </>
      )}
    </div>
  );
}

function History() {
  const { data, isPending, isError, error, refetch } = useGdpiSessions();
  if (isPending) return <Skeleton rows={3} />;
  if (isError)
    return (
      <StateBlock
        tone="error"
        title="Couldn't load your sessions"
        detail={mbaErrorMessage(error)}
        action={{ label: 'Try again', onClick: () => void refetch() }}
      />
    );
  if (!data.sessions.length)
    return (
      <StateBlock
        tone="empty"
        title="No practice sessions yet"
        detail="Start a mock interview or a timed WAT — your feedback will be saved here."
        action={{ label: 'Start a mock interview', href: '/mba/gdpi/interview' }}
      />
    );
  return (
    <ul className="space-y-2">
      {data.sessions.map((s) => (
        <li key={s.id}>
          <Link
            to={`/mba/gdpi/${s.kind === 'wat' ? 'wat' : 'interview'}?session=${encodeURIComponent(s.id)}`}
            className="ss-panel flex flex-wrap items-center gap-3 p-4 hover:opacity-80"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-50)] text-[var(--brand-purple-600)]">
              {s.kind === 'wat' ? <PenLine className="h-5 w-5" /> : <MessagesSquare className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">
                {s.kind === 'wat' ? `WAT: ${s.title}` : s.title}
              </span>
              <span className="block font-[Poppins] text-[12px] text-[var(--neutral-500)]">
                {formatDate(s.startedAt)} · {s.answered}/{s.total} answered
                {s.status === 'in_progress' ? ' · in progress' : ''}
              </span>
            </span>
            {s.focus && <GroupChip group={s.focus} />}
            <span className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">
              {s.overall !== null ? `${s.overall.toFixed(1)}/5` : '—'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MbaGdpi() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'pi';

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <SkyBanner
        eyebrow="Interview prep"
        title="WAT, GD and PI — get ready for the final round"
        lead="Browse topics and questions with guidance on what panels look for, then practise with AI feedback on your own answers."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/mba/gdpi/interview" className="ss-panel flex items-start gap-3 p-4 hover:opacity-80 md:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-50)] text-[var(--brand-purple-600)]">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <span>
            <span className="ss-display block text-[16px] text-[var(--ink)]">AI mock interview</span>
            <span className="mt-1 block font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-500)]">
              Five questions, one at a time. Type or speak your answer and get scores, strengths and a stronger outline.
            </span>
          </span>
        </Link>
        <Link to="/mba/gdpi/wat" className="ss-panel flex items-start gap-3 p-4 hover:opacity-80 md:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-50)] text-[var(--brand-purple-600)]">
            <PenLine className="h-5 w-5" />
          </span>
          <span>
            <span className="ss-display block text-[16px] text-[var(--ink)]">Timed WAT essay</span>
            <span className="mt-1 block font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-500)]">
              Write against a 15- or 20-minute clock with a live word count, then get feedback on your essay.
            </span>
          </span>
        </Link>
      </div>

      <Link
        to="/mba/shortlist?request=mock_interview#counsellor"
        className="ss-panel flex items-center gap-3 p-4 hover:opacity-80 md:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple-50)] text-[var(--brand-purple-600)]">
          <Headset className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="ss-display block text-[16px] text-[var(--ink)]">Mock interview with a counsellor</span>
          <span className="mt-1 block font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-500)]">
            Pick up to three slots that suit you and a ProCounsel counsellor will call to confirm one.
          </span>
        </span>
      </Link>

      <div role="tablist" aria-label="Interview prep sections" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'pi' ? {} : { tab: t.id }, { replace: true })}
            className="cursor-pointer rounded-full border px-4 py-2 font-[Poppins] text-[13px] font-semibold"
            style={{
              borderColor: tab === t.id ? 'var(--brand-purple-500)' : 'var(--borders-default)',
              background: tab === t.id ? 'var(--brand-purple-500)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--neutral-600)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'history' ? <History /> : <Bank key={tab} kind={tab} />}
    </div>
  );
}
