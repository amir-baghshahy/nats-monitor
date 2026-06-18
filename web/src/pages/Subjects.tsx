import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Globe,
  Activity,
  FolderOpen,
} from "lucide-react";
import { HealthService } from "../types";
import type { github_com_amir_nats_monitor_internal_dto_SubjectInfo as SubjectInfo } from "../types";

export default function Subjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: subjectsResponse, refetch } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => HealthService.getSubjects(),
    refetchInterval: 10000,
  });

  const subjects = subjectsResponse?.subjects || [];

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const buildSubjectTree = () => {
    const groups = new Map<
      string,
      { children: SubjectInfo[]; count: number }
    >();

    subjects.forEach((s: SubjectInfo) => {
      const subject = s.name || "";
      const parts = subject.split(".");
      const topLevel = parts[0] || "root";

      if (!groups.has(topLevel)) {
        groups.set(topLevel, { children: [], count: 0 });
      }

      const group = groups.get(topLevel)!;
      group.count += s.count || 0;
      group.children.push(s);
    });

    return Array.from(groups.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      children: data.children,
    }));
  };

  const subjectTree = buildSubjectTree();

  const renderNode = (
    node: { name: string; count: number; children: SubjectInfo[] },
    depth: number = 0,
  ) => {
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
            {node.count?.toLocaleString()} msgs
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

  const filteredSubjects = subjects.filter((s: SubjectInfo) =>
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Subjects</h1>
          <p className="text-dark-muted mt-1">
            Subjects from NATS JetStream streams
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
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
              Tree
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
              List
            </button>
          </div>
        </div>
      </div>

      {subjects.length === 0 && (
        <div className="card text-center p-12">
          <Globe className="w-16 h-16 text-dark-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Subjects Found</h3>
          <p className="text-dark-muted">
            Create streams with subjects to see them here.
          </p>
        </div>
      )}

      {subjects.length > 0 && (
        <>
          {viewMode === "tree" ? (
            <div className="card p-4">
              <div className="space-y-1">
                {subjectTree.map((node) => renderNode(node))}
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Messages</th>
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
          )}
        </>
      )}
    </div>
  );
}
