
type Props = {
  count: number;
};

/**
 * Shows a glowing-dot "X online" pill. Currently driven by the number
 * of builders currently loaded as a reasonable stand-in. To wire up
 * true real-time presence later, swap the `count` prop for a value
 * derived from a Supabase Realtime presence channel
 * (supabase.channel('online-users').on('presence', ...)) — this
 * component itself doesn't need to change.
 */
export default function OnlineStatusBar({ count }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-1.5 transition-colors">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>

      <span className="text-xs font-medium text-muted">
        <span className="font-semibold text-foreground">{count}</span> online
      </span>
    </div>
  );
}
