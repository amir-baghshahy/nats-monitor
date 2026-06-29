import { useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow'
// @ts-ignore - CSS import for React Flow
import 'reactflow/dist/style.css'
import { StreamNode } from './nodes/StreamNode'
import { ConsumerNode } from './nodes/ConsumerNode'

const nodeTypes: NodeTypes = {
  stream: StreamNode,
  consumer: ConsumerNode,
}

interface StreamGraphProps {
  initialNodes: any[]
  initialEdges: any[]
  onNodeClick?: (node: any) => void
}

export function StreamGraph({ initialNodes, initialEdges, onNodeClick }: StreamGraphProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick = useCallback((_: any, node: any) => {
    onNodeClick?.(node)
  }, [onNodeClick])

  return (
    <div className="h-full w-full bg-dark-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#64748b', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="rgba(100, 116, 139, 0.3)"
        />
        <Controls className="!bg-dark-card !border !border-dark-border/60 !text-dark-text" />
        <MiniMap
          nodeColor={(node) => {
            return node.type === 'stream' ? '#3b82f6' : '#60a5fa'
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="!bg-dark-card !border !border-dark-border/60"
        />
      </ReactFlow>
    </div>
  )
}
