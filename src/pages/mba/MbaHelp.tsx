import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import SkyBanner from '@/components/school-student/SkyBanner';
import { Skeleton } from '@/components/mba/ui';
import { formatDate } from '@/components/mba/format';
import { mbaErrorMessage } from '@/api/mba';
import {
  TICKET_CATEGORIES,
  TICKET_STATUS_LABEL,
  useCloseTicket,
  useCreateTicket,
  useTicketMessage,
  useTickets,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from '@/api/mbaCommunity';

const SUPPORT_EMAIL = 'support@procounsel.co.in';

/** Plain answers. Keep them true to how the app actually works (docs/mba-api.md). */
const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'Is ProCounsel MBA free?',
    a: 'Yes. Practice, mocks, past papers, the study plan, interview prep and the AI tutor are free. The AI tutor has a daily limit so it stays free for everyone.',
  },
  {
    q: 'Where do the questions and mocks come from?',
    a: (
      <>
        Every question shows its source under it. ProCounsel mocks are original questions written by our team in the CAT pattern. Past papers
        are the actual CAT questions from 2017 to 2025. The IIMs don&rsquo;t publish their answer keys publicly, so we solved every
        question ourselves and wrote the solutions. If an answer or solution looks wrong, tap <strong>Report an issue</strong> under the question and
        our faculty will check it.
      </>
    ),
  },
  {
    q: 'How is my mock scored?',
    a: 'Each section follows the marking of that paper’s exam pattern. For CAT: +3 for a correct answer, −1 for a wrong multiple-choice answer, and no negative marking for type-in-the-answer (TITA) questions or questions you leave. Section timers run on our server, so a mock keeps its time even if you close the tab.',
  },
  {
    q: 'What is the ProCounsel percentile? Is it my CAT percentile?',
    a: 'No. It compares your first attempt of a test with other ProCounsel students’ first attempts of the same test, and appears only once at least 20 others have taken it. It is not the official CAT percentile, and we never convert scores into an official percentile because no official mapping is published.',
  },
  {
    q: 'How does the score estimate work?',
    a: 'It estimates your CAT raw score from your own timed tests and practice: how many questions you attempt and how accurately, per section, with recent work counting more. It shows a range and how confident it is, and needs at least one timed test and 20 answers per section first. It is an estimate, not a prediction of your result.',
  },
  {
    q: 'Who answers my doubts?',
    a: 'Other students can reply straight away. Our faculty answer anything still open after a day, and faculty answers are marked Verified. You can try the AI tutor first on the same page.',
  },
  {
    q: 'Why can’t I share my number or a link in a doubt?',
    a: 'To keep everyone safe from spam and from people trying to move students to paid groups elsewhere. Discussions stay on ProCounsel, and anyone can report a post that breaks this.',
  },
  {
    q: 'Who can see my name?',
    a: 'Other students see only your display name (the one you set for the leaderboard, or your first name and last initial). Never your phone number. The leaderboard is optional.',
  },
  {
    q: 'How do I delete my MBA data?',
    a: (
      <>
        Go to <Link to="/mba/profile" className="font-semibold text-[var(--brand-purple-700)]">Profile</Link> and use{' '}
        <strong>Delete my MBA data</strong>. It removes your attempts, practice history, plan, tickets and other MBA data. Doubts you posted stay
        for others (they contain other students&rsquo; answers) but are shown as &ldquo;Former student&rdquo;. Your ProCounsellor account itself is not
        deleted.
      </>
    ),
  },
  {
    q: 'How do I contact you?',
    a: (
      <>
        Raise a ticket below — you&rsquo;ll see our reply here and in your notifications. You can also e-mail <strong>{SUPPORT_EMAIL}</strong>.
      </>
    ),
  },
];

const STATUS_TONE: Record<TicketStatus, { color: string; background: string }> = {
  open: { color: '#92400E', background: 'var(--gold-50)' },
  answered: { color: 'var(--green-600)', background: 'var(--green-50)' },
  closed: { color: 'var(--neutral-600)', background: 'var(--neutral-100)' },
};

const inputClass =
  'mt-1.5 block w-full rounded-xl border border-[var(--borders-default)] bg-white px-3.5 py-2.5 font-[Poppins] text-[13px] font-normal text-[var(--ink)] outline-none focus:border-[var(--brand-purple-400)]';

function NewTicketForm({ attemptId, questionId, onCreated }: { attemptId: string | null; questionId: string | null; onCreated: (t: Ticket) => void }) {
  const create = useCreateTicket();
  const [category, setCategory] = useState<TicketCategory>(attemptId ? 'mocks' : questionId ? 'questions' : 'technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const valid = subject.trim().length >= 3 && message.trim().length >= 10;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        create.mutate(
          {
            category,
            subject: subject.trim(),
            message: message.trim(),
            ...(attemptId ? { attemptId } : {}),
            ...(questionId ? { questionId } : {}),
          },
          {
            onSuccess: (t) => {
              setSubject('');
              setMessage('');
              onCreated(t);
            },
          },
        );
      }}
    >
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        What is it about?
        <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className={inputClass}>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        Subject
        <input value={subject} maxLength={120} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="e.g. Timer jumped during my mock" />
      </label>
      <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
        Message
        <textarea
          value={message}
          maxLength={3000}
          rows={4}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
          placeholder="What happened, and what did you expect? At least 10 characters."
        />
      </label>
      {(attemptId || questionId) && (
        <p className="font-[Poppins] text-[12px] text-[var(--neutral-500)]">
          We&rsquo;ll attach the {attemptId ? 'mock attempt' : 'question'} you came from, so support can see it.
        </p>
      )}
      <button
        type="submit"
        disabled={!valid || create.isPending}
        className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {create.isPending ? 'Sending…' : 'Raise ticket'}
      </button>
      {create.isError && (
        <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
          {mbaErrorMessage(create.error, 'Could not raise the ticket.')}
        </p>
      )}
    </form>
  );
}

function TicketItem({ ticket, open, onToggle }: { ticket: Ticket; open: boolean; onToggle: () => void }) {
  const send = useTicketMessage();
  const close = useCloseTicket();
  const [text, setText] = useState('');
  const category = TICKET_CATEGORIES.find((c) => c.id === ticket.category)?.label ?? 'Other';

  return (
    <li id={`ticket-${ticket.id}`} className="ss-panel overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-3 p-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">{ticket.subject}</span>
          <span className="block font-[Poppins] text-[11px] text-[var(--neutral-500)]">
            {category} · {formatDate(ticket.createdAt)}
          </span>
        </span>
        <span className="shrink-0 rounded-full px-2 py-0.5 font-[Poppins] text-[11px] font-semibold" style={STATUS_TONE[ticket.status]}>
          {TICKET_STATUS_LABEL[ticket.status]}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--neutral-400)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="space-y-3 border-t border-[var(--borders-default)] p-4">
          <ol className="space-y-2">
            {ticket.messages.map((m, i) => (
              <li
                key={`${m.at}-${i}`}
                className="rounded-2xl p-3"
                style={{ background: m.by === 'support' ? 'var(--brand-purple-50)' : 'var(--neutral-50)' }}
              >
                <p className="font-[Poppins] text-[11px] font-semibold text-[var(--neutral-600)]">
                  {m.by === 'support' ? m.authorName || 'ProCounsel support' : 'You'} · {formatDate(m.at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words font-[Poppins] text-[13px] text-[var(--neutral-800)]">{m.text}</p>
              </li>
            ))}
          </ol>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) send.mutate({ id: ticket.id, text: text.trim() }, { onSuccess: () => setText('') });
            }}
          >
            <label className="block font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
              {ticket.status === 'closed' ? 'Reply to reopen this ticket' : 'Add a reply'}
              <textarea value={text} maxLength={3000} rows={2} onChange={(e) => setText(e.target.value)} className={inputClass} />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!text.trim() || send.isPending}
                className="btn-primary cursor-pointer px-4 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {send.isPending ? 'Sending…' : 'Send'}
              </button>
              {ticket.status !== 'closed' && (
                <button
                  type="button"
                  disabled={close.isPending}
                  onClick={() => close.mutate(ticket.id)}
                  className="cursor-pointer font-[Poppins] text-[12px] font-semibold text-[var(--neutral-500)]"
                >
                  My problem is solved — close ticket
                </button>
              )}
            </div>
          </form>
          {(send.isError || close.isError) && (
            <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
              {mbaErrorMessage(send.error ?? close.error, 'Could not save.')}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** /mba/help — FAQ, "Raise a ticket", and the student's tickets with support replies. */
export default function MbaHelp() {
  const [params] = useSearchParams();
  const tickets = useTickets();
  const [openId, setOpenId] = useState<string | null>(params.get('ticket'));
  const attemptId = params.get('attemptId');
  const questionId = params.get('questionId');

  useEffect(() => {
    const id = params.get('ticket');
    if (id && tickets.data) document.getElementById(`ticket-${id}`)?.scrollIntoView({ block: 'start' });
  }, [params, tickets.data]);

  return (
    <div className="mx-auto max-w-[880px] space-y-5">
      <SkyBanner eyebrow="Help" title="Help centre" lead="Quick answers about how ProCounsel MBA works, and a way to reach our team." />

      <section className="space-y-2" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Frequently asked
        </h2>
        {FAQ.map((item) => (
          <details key={item.q} className="ss-panel group p-4">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-[Poppins] text-[14px] font-semibold text-[var(--ink)]">
              <span className="flex-1">{item.q}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-[var(--neutral-400)] transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-2 font-[Poppins] text-[13px] leading-relaxed text-[var(--neutral-600)]">{item.a}</div>
          </details>
        ))}
      </section>

      <section className="ss-panel space-y-3 p-4 md:p-5" aria-labelledby="ticket-heading">
        <h2 id="ticket-heading" className="ss-display flex items-center gap-2 text-[17px] text-[var(--ink)]">
          <LifeBuoy className="h-5 w-5 text-[var(--brand-purple-500)]" aria-hidden /> Raise a ticket
        </h2>
        <p className="font-[Poppins] text-[13px] text-[var(--neutral-600)]">
          For a doubt about a question, use <strong>Ask a doubt</strong> under it instead — you&rsquo;ll get answers faster.
        </p>
        <NewTicketForm attemptId={attemptId} questionId={questionId} onCreated={(t) => setOpenId(t.id)} />
      </section>

      <section className="space-y-3" aria-labelledby="my-tickets-heading">
        <h2 id="my-tickets-heading" className="ss-display text-[17px] text-[var(--ink)]">
          Your tickets
        </h2>
        {tickets.isPending ? (
          <Skeleton rows={2} />
        ) : tickets.isError ? (
          <p role="alert" className="font-[Poppins] text-[12px] text-[var(--red-500)]">
            {mbaErrorMessage(tickets.error, "Couldn't load your tickets.")}
          </p>
        ) : tickets.data.tickets.length === 0 ? (
          <p className="font-[Poppins] text-[13px] text-[var(--neutral-500)]">No tickets yet.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.data.tickets.map((t) => (
              <TicketItem key={t.id} ticket={t} open={openId === t.id} onToggle={() => setOpenId(openId === t.id ? null : t.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
