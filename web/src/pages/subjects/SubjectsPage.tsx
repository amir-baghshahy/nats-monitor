import type { SubjectInfo } from '../../types'
import { UseSubjectsReturn } from './hooks/useSubjects'
import {
  Search, RefreshCw, ChevronRight, ChevronDown,
  MessageSquare, Globe, Activity, FolderOpen
} from 'lucide-react'

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
          const subjectTree = buildSubjectTree()

          const renderNode = (
            node: any,
            depth: number = 0,
          ) => {
    const isExpanded = expandedNodes.has(node.name)
    const hasChildren = node.children && node.children.length > 0

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

          {node.name.includes('>') ? (
            <Globe className="w-4 h-4 text-primary-400" />
          ) : (
            <Activity className="w-4 h-4 text-dark-muted" />
          )}

          <span className={depth === 0 ? 'font-semibold' : ''}>
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
    )
  }

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
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === 'tree'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-muted'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-muted'
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
          {viewMode === 'tree' ? (
            <div className="card overflow-hidden flex flex-col max-h-[600px]">
              <div className="overflow-y-auto scrollbar-thin flex-1 p-4">
                <div className="space-y-1">
                  {subjectTree.map((node) => renderNode(node))}
                </div>
              </div>
              <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden flex flex-col max-h-[600px]">
              <div className="overflow-x-auto overflow-y-auto scrollbar-thin flex-1">
                <table className="table">
                  <thead className="sticky top-0 bg-dark-bg z-10">
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
                            {(s.name || '').includes('>') ? (
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
              <div className="p-3 border-t border-dark-border bg-dark-bg/50 text-center text-sm text-dark-muted flex-shrink-0">
                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
