export interface FilterTab {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

interface FilterTabsProps {
  readonly tabs: readonly FilterTab[];
  readonly activeTab: string;
  readonly onTabChange: (id: string) => void;
  readonly className?: string;
}

export const FilterTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: FilterTabsProps): React.JSX.Element => (
  <div role="tablist" className={`flex gap-2 ${className}`}>
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`tabular-nums ${
                isActive ? 'text-primary-foreground/80' : 'text-subtle'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
