import { useCallback } from "react"
import { useReactFlow } from "@xyflow/react"
import type { Node, NodeChange } from "@xyflow/react"

export type LayoutDirection = "TB" | "LR"

export function useAutoLayout<NodeType extends Node = Node>() {
  const { getNodes, getEdges, fitView } = useReactFlow<NodeType>()

  const layout = useCallback(
    async (direction: LayoutDirection, onNodesChange: (changes: NodeChange<NodeType>[]) => void) => {
      const { default: dagre } = await import("dagre")
      const dagreGraph = new dagre.graphlib.Graph()
      dagreGraph.setDefaultEdgeLabel(() => ({}))

      dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 })

      const nodes = getNodes()
      const edges = getEdges()

      if (nodes.length === 0) return

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
          width: node.width || 150,
          height: node.height || 60,
        })
      })

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
      })

      dagre.layout(dagreGraph)

      const changes: NodeChange<NodeType>[] = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        return {
          type: "position",
          id: node.id,
          position: {
            x: nodeWithPosition.x - (node.width || 150) / 2,
            y: nodeWithPosition.y - (node.height || 60) / 2,
          },
        }
      })

      onNodesChange(changes)

      window.requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.2 })
      })
    },
    [getNodes, getEdges, fitView]
  )

  return layout
}

