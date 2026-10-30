
import { NotificationTab, TABS } from "../types";

type Props = {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  unreadCounts: Record<NotificationTab, number>;
};

export default function NotificationTabs({
  activeTab,
  onTabChange,
  unreadCounts,
}: Props) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 transition-colors">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = unreadCounts[tab.key];

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
              isActive
                ? "bg-surface-secondary text-foreground shadow-sm"
                : "text-muted hover:bg-surface-secondary/60 hover:text-foreground"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>

            {count > 0 && (
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-[#00AFEF] text-white"
                    : "bg-[#00AFEF]/15 text-[#00AFEF]"
                }`}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
