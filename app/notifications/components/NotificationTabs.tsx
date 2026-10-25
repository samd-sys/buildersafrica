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
    <div className="flex items-center gap-1 rounded-xl border border-white/30 bg-[#121215] p-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = unreadCounts[tab.key];

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
              isActive
                ? "bg-[#1F1F23] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            {count > 0 && (
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-[#00AFEF] text-white"
                    : "bg-[#00AFEF]/30 text-white"
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