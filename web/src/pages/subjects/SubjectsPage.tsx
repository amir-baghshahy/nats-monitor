import type { SubjectInfo } from "../../types";
import { UseSubjectsReturn } from "./hooks/useSubjects";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Globe,
  Activity,
  FolderOpen,
} from "lucide-react";
import { PageHeader, FilterBar, EmptyState, PanelCard } from "../../components/ui";
import { Button } from "../../components/ui";

export default function SubjectsPage({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  expandedNodes,
  refetch,
  subjects,
  toggleNode,
  buildSubjectTree,
  filteredSubjects,
}: UseSubjectsReturn) {
  const { t } = useTranslation();
  const subjectTree = buildSubjectTree();

  const renderNode = (node: any, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.name);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.name} style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        <div
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-bg/50 transition-colors cursor-pointer"
          onClick={() => hasChildren && toggleNode(node.name)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-dark-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-dark-muted" />
            )
          ) : (
            <div className="w-4" />
          )}

          {node.name.includes(">") ? (
            <Globe className="w-4 h-4 text-primary-400" />
          ) : (
            <Activity className="w-4 h-4 text-dark-muted" />
          )}

          <span className={depth === 0 ? "font-semibold" : ""}>
            {node.name}
          </span>
          <span className="ml-auto text-xs text-dark-muted">
            {t("subjects.messageCount", { count: node.count })}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child: SubjectInfo) => (
              <div
                key={child.name}
                className="flex items-center gap-2 p-2 pl-8 text-sm text-dark-muted"
              >
                <Activity className="w-4 h-4" />
                <span className="font-mono">{child.name}</span>
                <span className="ml-auto text-xs">
                  {(child.count || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t("subjects.title")}
        subtitle={t("subjects.subtitle")}
        actions={
           <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()} />
        }
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("subjects.searchPlaceholder")}
        filters={
          <div className="flex items-center bg-dark-bg rounded-lg p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "tree"
                  ? "bg-primary-600 text-white"
                  : "text-dark-muted"
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              {t("subjects.tree")}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-primary-600 text-white"
                  : "text-dark-muted"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              {t("subjects.list")}
            </button>
          </div>
        }
      />

      {subjects.length === 0 && (
        <EmptyState
          icon={Globe}
          title={t("subjects.noSubjectsFound")}
          description={t("subjects.noSubjectsFoundDescription")}
        />
      )}

      {subjects.length > 0 && (
        <>
          {viewMode === "tree" ? (
            <PanelCard maxHeight={600} footer={<span>{t("subjects.subjectCount", { count: filteredSubjects.length })}</span>}>
              <div className="overflow-y-auto scrollbar-thin flex-1 p-4">
                <div className="space-y-1">
                  {subjectTree.map((node) => renderNode(node))}
                </div>
              </div>
            </PanelCard>
          ) : (
            <PanelCard maxHeight={600} footer={<span>{t("subjects.subjectCount", { count: filteredSubjects.length })}</span>}>
              <div className="overflow-x-auto overflow-y-auto scrollbar-thin flex-1">
                <table className="table">
                  <thead className="sticky top-0 bg-dark-bg z-10">
                    <tr>
                      <th>{t("subjects.subject")}</th>
                      <th>{t("subjects.messages")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((s: SubjectInfo, i: number) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2">
                            {(s.name || "").includes(">") ? (
                              <Globe className="w-4 h-4 text-primary-400" />
                            ) : (
                              <Activity className="w-4 h-4 text-dark-muted" />
                            )}
                            <span className="font-mono">{s.name}</span>
                          </div>
                        </td>
                        <td>{(s.count || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          )}
        </>
      )}
    </div>
  );
}
