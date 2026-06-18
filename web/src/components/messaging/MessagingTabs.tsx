export type MessagingTab = "messages" | "publish" | "request" | "monitor" | "services" | "subjects";

interface TabConfig {
  id: MessagingTab;
  label: string;
}

interface MessagingTabsProps {
  activeTab: MessagingTab;
  messagesCount: number;
  onTabChange: (tab: MessagingTab) => void;
}

export default function MessagingTabs({
  activeTab,
  messagesCount,
  onTabChange,
}: MessagingTabsProps) {
  const tabs: TabConfig[] = [
    { id: "messages", label: `Messages (${messagesCount})` },
    { id: "publish", label: "Publish" },
    { id: "request", label: "Request/Reply" },
    { id: "monitor", label: "Traffic Monitor" },
    { id: "subjects", label: "Subjects" },
    { id: "services", label: "Services" },
  ];

  return (
    <div className="mb-6 border-b border-dark-border pb-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Core messaging actions">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-500/20 text-primary-400"
                  : "text-dark-muted hover:bg-dark-bg hover:text-dark-text"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
