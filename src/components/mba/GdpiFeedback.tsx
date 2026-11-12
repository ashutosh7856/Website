import { useState, type ReactNode } from 'react';
import { ChevronDown, CheckCircle2, Lightbulb, ListOrdered, TrendingUp } from 'lucide-react';
import {
  SCORE_LABELS,
  groupLabel,
  type FeedbackScores,
  type GdpiFeedback,
  type GdpiItem,
} from '@/api/mbaGdpi';

/** Shared pieces of the GDPI pages: score bars, the AI feedback card and an item's guidance. */

export function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold whitespace-nowrap"
      style={{
        borderColor: active ? 'var(--brand-purple-500)' : 'var(--borders-default)',
        background: active ? 'var(--brand-purple-500)' : '#fff',
        color: active ? '#fff' : 'var(--neutral-600)',
      }}
    >
      {children}
    </button>
  );
}

export function GroupChip({ group }: { group: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--brand-purple-50)] px-2.5 py-0.5 font-[Poppins] text-[11px] font-bold text-[var(--brand-purple-700)]">
      {groupLabel(group)}
    </span>
  );
}

export function ScoreBars({ scores }: { scores: FeedbackScores }) {
  return (
    <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {SCORE_LABELS.map(({ key, label }) => (
        <li key={key} className="font-[Poppins] text-[12px]">
          <div className="flex items-center justify-between text-[var(--neutral-600)]">
            <span className="font-semibold">{label}</span>
            <span className="font-bold text-[var(--ink)]" aria-label={`${label} ${scores[key]} out of 5`}>
              {scores[key]}/5
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--neutral-100)]">
            <div
              className="h-full rounded-full bg-[var(--brand-purple-500)]"
              style={{ width: `${(scores[key] / 5) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items, tone }: { items: string[]; tone?: 'ordered' }) {
  const Tag = tone === 'ordered' ? 'ol' : 'ul';
  return (
    <Tag
      className={`mt-1.5 space-y-1 pl-5 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)] ${
        tone === 'ordered' ? 'list-decimal' : 'list-disc'
      }`}
    >
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

export function FeedbackCard({ feedback, title = 'AI feedback' }: { feedback: GdpiFeedback; title?: string }) {
  return (
    <section className="rounded-2xl border border-[var(--borders-purple-soft)] bg-[var(--surfaces-card-purple)] p-4 md:p-5">
      <h3 className="flex items-center gap-1.5 font-[Poppins] text-[13px] font-bold text-[var(--ink)]">
        <Lightbulb className="h-4 w-4 text-[var(--gold-500)]" />
        {title}
      </h3>
      {feedback.fallback && (
        <p className="mt-2 font-[Poppins] text-[12px] text-[var(--neutral-600)]">
          Detailed scoring wasn't available for this answer, so here is the general structure to aim for.
        </p>
      )}
      {feedback.scores && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <ScoreBars scores={feedback.scores} />
        </div>
      )}
      {feedback.strengths.length > 0 && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="ss-eyebrow flex items-center gap-1 text-[var(--green-600)]">
            <CheckCircle2 className="h-3.5 w-3.5" /> What worked
          </p>
          <BulletList items={feedback.strengths} />
        </div>
      )}
      {feedback.improvements.length > 0 && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="ss-eyebrow flex items-center gap-1 text-[var(--brand-purple-600)]">
            <TrendingUp className="h-3.5 w-3.5" /> To improve
          </p>
          <BulletList items={feedback.improvements} />
        </div>
      )}
      {feedback.betterOutline.length > 0 && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="ss-eyebrow flex items-center gap-1 text-[var(--neutral-500)]">
            <ListOrdered className="h-3.5 w-3.5" /> A stronger outline
          </p>
          <BulletList items={feedback.betterOutline} tone="ordered" />
        </div>
      )}
      <p className="mt-3 font-[Poppins] text-[11px] text-[var(--neutral-400)]">
        AI feedback is a practice aid based only on what you wrote. It can't predict interview or admission outcomes.
      </p>
    </section>
  );
}

/** The guidance stored with a topic / question (framing, what to look for, angles, structure, pitfalls). */
export function ItemGuidance({ item }: { item: GdpiItem }) {
  const framingLabel = item.kind === 'pi' ? 'What the panel is assessing' : 'How to read it';
  return (
    <div className="space-y-3">
      {item.framing && (
        <div>
          <p className="ss-eyebrow text-[var(--neutral-500)]">{framingLabel}</p>
          <p className="mt-1 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-800)]">{item.framing}</p>
        </div>
      )}
      {item.angles.length > 0 && (
        <div>
          <p className="ss-eyebrow text-[var(--neutral-500)]">Angles to explore</p>
          <ul className="mt-1.5 space-y-2">
            {item.angles.map((angle) => (
              <li key={angle.angle} className="rounded-xl border border-[var(--borders-default)] bg-white p-3">
                <p className="font-[Poppins] text-[13px] font-bold text-[var(--ink)]">{angle.angle}</p>
                <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-lg bg-[var(--green-50)] p-2.5 font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-800)]">
                    <strong className="block text-[11px] text-[var(--green-600)]">For</strong>
                    {angle.forView}
                  </p>
                  <p className="rounded-lg bg-[var(--neutral-50)] p-2.5 font-[Poppins] text-[12px] leading-relaxed text-[var(--neutral-800)]">
                    <strong className="block text-[11px] text-[var(--red-500)]">Against</strong>
                    {angle.againstView}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.lookFor.length > 0 && (
        <div>
          <p className="ss-eyebrow text-[var(--neutral-500)]">What evaluators look for</p>
          <BulletList items={item.lookFor} />
        </div>
      )}
      {item.structure.length > 0 && (
        <div>
          <p className="ss-eyebrow text-[var(--neutral-500)]">
            {item.kind === 'pi' ? 'A strong answer' : 'A workable structure'}
          </p>
          <BulletList items={item.structure} tone="ordered" />
        </div>
      )}
      {item.avoid.length > 0 && (
        <div>
          <p className="ss-eyebrow text-[var(--neutral-500)]">Avoid</p>
          <BulletList items={item.avoid} />
        </div>
      )}
    </div>
  );
}

/** A collapsible bank entry: the prompt is always visible, the guidance opens on demand. */
export function ItemCard({ item, action }: { item: GdpiItem; action?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="ss-panel p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <GroupChip group={item.group} />
        {item.background && (
          <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)] capitalize">{item.background}</span>
        )}
      </div>
      <h3 className="ss-display mt-2 text-[16px] leading-snug text-[var(--ink)]">{item.prompt}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="btn-secondary inline-flex cursor-pointer items-center gap-1 px-3.5 py-1.5 font-[Poppins] text-[12px] font-semibold"
        >
          {open ? 'Hide guidance' : 'Show guidance'}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {action}
      </div>
      {open && (
        <div className="mt-4 border-t border-[var(--borders-default)] pt-4">
          <ItemGuidance item={item} />
        </div>
      )}
    </article>
  );
}
