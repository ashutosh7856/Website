import { useId, useRef, useState } from 'react';
import { Check, ChevronDown, FileText, Plus, Upload, X } from 'lucide-react';
import { mbaErrorMessage } from '@/api/mba';
import {
  documentProblem,
  mbaApplicationsApi,
  useAddChecklistItem,
  useDeleteChecklistItem,
  useDeleteDocument,
  useSetDocumentSharing,
  useToggleChecklistItem,
  useUploadDocument,
  type Application,
  type ApplicationDocument,
  type ChecklistItem,
  type DocumentsConfig,
} from '@/api/mbaApplications';
import { formatDate } from '@/components/mba/format';

const LABEL_MAX = 120;
const MAX_FILES_PER_ITEM = 5;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

const sizeText = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Opens a short-lived signed link. The tab opens first (inside the click) so pop-up blockers allow it. */
async function openDocument(docId: string): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const { url } = await mbaApplicationsApi.downloadLink(docId);
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch (err) {
    tab?.close();
    throw err;
  }
}

function DocumentLine({ doc }: { doc: ApplicationDocument }) {
  const share = useSetDocumentSharing();
  const remove = useDeleteDocument();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shareId = useId();
  const busy = share.isPending || remove.isPending;
  const onError = (err: unknown) => setError(mbaErrorMessage(err, 'Could not save.'));

  return (
    <li className="space-y-1 rounded-xl bg-[var(--neutral-50)] px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <FileText className="h-4 w-4 shrink-0 text-[var(--brand-purple-500)]" aria-hidden />
        <button
          type="button"
          onClick={() => {
            setError(null);
            openDocument(doc.id).catch((err) => setError(mbaErrorMessage(err, 'Could not open the file.')));
          }}
          className="min-w-0 max-w-full cursor-pointer truncate font-[Poppins] text-[12.5px] font-semibold text-[var(--brand-purple-600)] underline"
          title={`Open ${doc.fileName}`}
        >
          {doc.fileName}
        </button>
        <span className="font-[Poppins] text-[11px] text-[var(--neutral-500)]">{sizeText(doc.size)}</span>
        <span className="ml-auto flex items-center gap-1">
          {confirming ? (
            <>
              <span className="font-[Poppins] text-[11.5px] text-[var(--neutral-600)]">Delete this file?</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove.mutate(doc.id, { onError })}
                className="cursor-pointer rounded-lg bg-[var(--red-500)] px-2 py-1 font-[Poppins] text-[11.5px] font-semibold text-white disabled:opacity-50"
              >
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="cursor-pointer rounded-lg px-2 py-1 font-[Poppins] text-[11.5px] font-semibold text-[var(--neutral-600)] hover:bg-white"
              >
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label={`Delete ${doc.fileName}`}
              onClick={() => setConfirming(true)}
              className="cursor-pointer rounded-lg p-1 text-[var(--neutral-500)] hover:bg-red-50 hover:text-[var(--red-500)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </span>
      </div>
      <label
        htmlFor={shareId}
        className="flex cursor-pointer items-center gap-2 font-[Poppins] text-[11.5px] text-[var(--neutral-600)]"
      >
        <input
          id={shareId}
          type="checkbox"
          checked={doc.shareWithCounsellor}
          disabled={busy}
          onChange={(e) => share.mutate({ docId: doc.id, share: e.target.checked }, { onError })}
          className="h-3.5 w-3.5 accent-[var(--brand-purple-500)]"
        />
        {doc.shareWithCounsellor ? 'Shared with my counsellor' : 'Share with my counsellor'}
      </label>
      {error && (
        <p role="alert" className="font-[Poppins] text-[11.5px] text-[var(--red-500)]">
          {error}
        </p>
      )}
    </li>
  );
}

function UploadButton({ slug, item, config }: { slug: string; item: ChecklistItem; config: DocumentsConfig }) {
  const upload = useUploadDocument();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  if (item.notApplicable || item.documents.length >= MAX_FILES_PER_ITEM) return null;

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const problem = documentProblem(file, config.maxBytes);
    if (problem) {
      setError(problem);
      return;
    }
    upload.mutate(
      { slug, itemId: item.id, file },
      {
        onError: (err) => setError(mbaErrorMessage(err, err instanceof Error ? err.message : 'Could not upload.')),
      },
    );
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
        aria-label={`Upload a file for ${item.label}`}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-[Poppins] text-[11.5px] font-semibold text-[var(--brand-purple-500)] hover:bg-[#F1F3F8] disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        {upload.isPending ? 'Uploading…' : item.documents.length ? 'Add another file' : 'Upload file'}
      </button>
      {error && (
        <p role="alert" className="font-[Poppins] text-[11.5px] text-[var(--red-500)]">
          {error}
        </p>
      )}
    </div>
  );
}

/** "28 Nov 2026" for a full date, the raw "2026-09" for a month-only one. */
const dateText = (d: string) => (d.length === 10 ? formatDate(d) : d);

function OfficialDatesLine({ app }: { app: Application }) {
  const od = app.officialDates;
  if (!od || (!od.applicationDeadline && !od.applicationOpens && !od.examDate)) return null;
  const parts = [
    od.applicationOpens && `opens ${dateText(od.applicationOpens)}`,
    od.applicationDeadline && `closes ${dateText(od.applicationDeadline)}`,
    od.examDate && `exam ${dateText(od.examDate)}`,
  ].filter(Boolean);
  return (
    <p className="font-[Poppins] text-[12px] text-[var(--neutral-600)]">
      <span className="font-semibold">Official dates:</span> {parts.join(' · ')}
      {app.deadlineSource === 'official' && ' (used as your deadline)'}
      {od.sourceUrl && (
        <>
          {' · '}
          <a href={od.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--brand-purple-500)] underline">
            source
          </a>
        </>
      )}
    </p>
  );
}

function Row({ slug, item, docs }: { slug: string; item: ChecklistItem; docs: DocumentsConfig | undefined }) {
  const toggle = useToggleChecklistItem();
  const remove = useDeleteChecklistItem();
  const [error, setError] = useState<string | null>(null);
  const busy = toggle.isPending || remove.isPending;
  const onError = (err: unknown) => setError(mbaErrorMessage(err, 'Could not save.'));

  return (
    <li className="flex flex-wrap items-start gap-2 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={item.label}
        disabled={busy || item.notApplicable}
        onClick={() => toggle.mutate({ slug, itemId: item.id, done: !item.done }, { onError })}
        className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderColor: item.done ? '#059669' : 'var(--borders-default)',
          background: item.done ? '#059669' : '#fff',
        }}
      >
        {item.done && <Check className="h-3.5 w-3.5 text-white" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`font-[Poppins] text-[13px] ${item.notApplicable ? 'text-[var(--neutral-400)] line-through' : 'text-[var(--ink)]'}`}
        >
          {item.label}
        </p>
        {item.hint && !item.notApplicable && (
          <p className="font-[Poppins] text-[11.5px] text-[var(--neutral-500)]">{item.hint}</p>
        )}
        {error && (
          <p role="alert" className="font-[Poppins] text-[11.5px] text-[var(--red-500)]">
            {error}
          </p>
        )}
        {(item.documents ?? []).length > 0 && (
          <ul className="mt-1.5 space-y-1.5" aria-label={`Files for ${item.label}`}>
            {item.documents.map((d) => (
              <DocumentLine key={d.id} doc={d} />
            ))}
          </ul>
        )}
        {docs?.enabled && <UploadButton slug={slug} item={item} config={docs} />}
      </div>
      {item.optional && !item.custom && (
        <button
          type="button"
          disabled={busy}
          onClick={() => toggle.mutate({ slug, itemId: item.id, notApplicable: !item.notApplicable }, { onError })}
          className="cursor-pointer rounded-lg px-2 py-1 font-[Poppins] text-[11.5px] font-semibold text-[var(--neutral-500)] hover:bg-[#F1F3F8] disabled:opacity-50"
        >
          {item.notApplicable ? 'Applies to me' : 'Not applicable'}
        </button>
      )}
      {item.custom && (
        <button
          type="button"
          disabled={busy}
          aria-label={`Remove ${item.label}`}
          onClick={() => remove.mutate({ slug, itemId: item.id }, { onError })}
          className="cursor-pointer rounded-lg p-1 text-[var(--neutral-500)] hover:bg-red-50 hover:text-[var(--red-500)] disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </li>
  );
}

/** Document checklist for one shortlisted institute (collapsed to a progress bar by default). */
export default function ApplicationChecklist({ app, documents }: { app: Application; documents?: DocumentsConfig }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddChecklistItem();
  const { done, total } = app.progress;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const panelId = `checklist-${app.slug}`;

  const submit = () => {
    const value = label.trim();
    if (!value) return;
    setError(null);
    add.mutate(
      { slug: app.slug, label: value },
      {
        onSuccess: () => setLabel(''),
        onError: (err) => setError(mbaErrorMessage(err, 'Could not add.')),
      },
    );
  };

  return (
    <div className="ss-surface space-y-2 p-3">
      <OfficialDatesLine app={app} />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 text-left"
      >
        <span className="font-[Poppins] text-[12.5px] font-semibold text-[var(--ink)]">Documents</span>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#E4E7F2]" aria-hidden>
          <span
            className="block h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#059669' : 'var(--brand-purple-500)',
            }}
          />
        </span>
        <span className="font-[Poppins] text-[12px] font-semibold text-[var(--neutral-600)]">
          {done}/{total} ready
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--neutral-500)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId}>
          <ul className="divide-y divide-[var(--borders-default)]">
            {app.checklist.map((item) => (
              <Row key={item.id} slug={app.slug} item={item} docs={documents} />
            ))}
          </ul>
          {documents?.enabled && (
            <p className="mt-1 font-[Poppins] text-[11px] text-[var(--neutral-500)]">
              Files: PDF, JPG or PNG up to 5 MB. Only you can see them, unless you tick “Share with my counsellor” on a
              file.
            </p>
          )}
          <form
            className="mt-2 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, LABEL_MAX))}
              maxLength={LABEL_MAX}
              placeholder="Add your own item, e.g. passport-size photo"
              aria-label="New checklist item"
              className="min-w-0 flex-1 rounded-xl border border-[var(--borders-default)] bg-white px-3 py-2 font-[Poppins] text-[13px] text-[var(--ink)]"
            />
            <button
              type="submit"
              disabled={!label.trim() || add.isPending}
              className="btn-secondary flex cursor-pointer items-center gap-1 px-3 py-2 font-[Poppins] text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {add.isPending ? 'Adding…' : 'Add'}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-1 font-[Poppins] text-[12px] text-[var(--red-500)]">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
