import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/AuthStore';
import { probuddiesApi } from '@/api/pro-buddies';
import { Loader2, Phone } from 'lucide-react';

type AnyMap = Record<string, unknown>;

const isAnyMap = (v: unknown): v is AnyMap =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toHistoryArray = (payload: unknown): AnyMap[] => {
  if (Array.isArray(payload)) return payload.filter(isAnyMap);
  if (!isAnyMap(payload)) return [];
  const candidateKeys = ['data', 'result', 'items', 'callHistory', 'history', 'calls'];
  for (const key of candidateKeys) {
    const node = payload[key];
    if (Array.isArray(node)) return node.filter(isAnyMap);
  }
  if (isAnyMap(payload.data)) {
    for (const key of candidateKeys) {
      const node = (payload.data as AnyMap)[key];
      if (Array.isArray(node)) return node.filter(isAnyMap);
    }
  }
  return [];
};

const toStr = (value: unknown, fallback = 'NA') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const toDateAndTime = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return { dateLabel: 'NA', timeLabel: 'NA' };
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return { dateLabel: value, timeLabel: 'NA' };
  return {
    dateLabel: parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeLabel: parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const toDurationLabel = (seconds: unknown) => {
  const num = Number(seconds);
  if (!Number.isFinite(num) || num < 0) return 'NA';
  if (num === 0) return '0s';
  const m = Math.floor(num / 60);
  const s = num % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-green-50', text: 'text-green-600' },
  failed:    { bg: 'bg-red-50',   text: 'text-red-500'   },
  missed:    { bg: 'bg-yellow-50',text: 'text-yellow-600' },
  busy:      { bg: 'bg-orange-50',text: 'text-orange-500' },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLES[status.toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-500' };

const buildAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6B7280&color=ffffff&size=80`;

export default function CallHistoryTab() {
  const { userId } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userCallHistory', userId],
    queryFn: () => probuddiesApi.userCallHistory(userId!),
    enabled: !!userId,
  });

  const rows = toHistoryArray(data).map((item, index) => {
    const { dateLabel, timeLabel } = toDateAndTime(item.startTime ?? item.callDateTime ?? item.createdAt);
    const rawStatus = toStr(item.status ?? item.callStatus, 'completed');
    const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
    const name = toStr(item.userFullName ?? item.proBuddyFullName ?? item.proBuddyName ?? null, 'ProBuddy');
    const photoUrl = toStr(item.userPhotoUrl ?? null, '');
    const proCoinTransferred = item.proCoinTransferred != null ? Number(item.proCoinTransferred) : null;

    return {
      id: toStr(item.id ?? item.callSid ?? `${index}`, `${index}`),
      name,
      photoUrl,
      dateLabel,
      timeLabel,
      durationLabel: toDurationLabel(item.conversationDuration ?? item.duration ?? item.callDuration),
      statusLabel,
      statusStyle: getStatusStyle(rawStatus),
      proCoinTransferred,
      eventType: toStr(item.eventType ?? null, ''),
    };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  if (error instanceof Error) {
    return <p className="text-red-500 py-4">{error.message}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-gray-500 py-4">No call history found.</p>;
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white font-['Poppins']">
      <div className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.id} className="px-4 py-3.5 flex items-center gap-3">
            {/* Avatar */}
            <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100">
              <img loading="lazy" decoding="async"
                src={row.photoUrl || buildAvatarUrl(row.name)}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#2F43F2] shrink-0" />
                <p className="text-[14px] font-semibold text-[#0E1629] truncate">{row.name}</p>
              </div>
              <p className="text-[12px] text-gray-400 mt-0.5">{row.dateLabel} · {row.timeLabel}</p>
              {row.eventType && (
                <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{row.eventType.replace(/_/g, ' ')}</p>
              )}
            </div>

            {/* Duration + coins */}
            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-[12px] text-gray-400">Duration</p>
              <p className="text-[13px] font-semibold text-[#0E1629]">{row.durationLabel}</p>
              {row.proCoinTransferred != null && (
                <p className="text-[11px] text-[#2F43F2] font-medium">
                  {row.proCoinTransferred > 0 ? `−${row.proCoinTransferred}` : row.proCoinTransferred} coins
                </p>
              )}
            </div>

            {/* Status badge */}
            <span className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold ${row.statusStyle.bg} ${row.statusStyle.text}`}>
              {row.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
