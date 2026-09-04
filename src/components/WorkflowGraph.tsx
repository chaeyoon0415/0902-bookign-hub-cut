import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface NodeData {
  id: string;
  label: string;
  count: number;
  color: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  highlight?: boolean;
}

export const WorkflowGraph = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [highlightedEdge, setHighlightedEdge] = useState<Edge | null>(null);
  const [highlightTimeout, setHighlightTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const nodeDefinitions: Omit<NodeData, 'count'>[] = [
    { id: 'received', label: '접수', color: '#f3f4f6', x: 50, y: 50 },
    { id: 'pending', label: '대기', color: '#f3f4f6', x: 150, y: 50 },
    { id: 'judging', label: '판정', color: '#ffffff', x: 250, y: 50 },
    { id: 'confirmed_auto', label: '확정-자동', color: '#d1fae5', x: 150, y: 150 },
    { id: 'confirmed_human', label: '확정-수동', color: '#dcfce7', x: 250, y: 150 },
    { id: 'review', label: '검토', color: '#fef3c7', x: 350, y: 150 },
    { id: 'rejected', label: '기각', color: '#fee2e2', x: 450, y: 150 },
    { id: 'asking', label: '질문', color: '#dbeafe', x: 550, y: 150 },
  ];

  const edges: Edge[] = [
    { from: 'received', to: 'pending' },
    { from: 'pending', to: 'judging' },
    { from: 'judging', to: 'confirmed_auto' },
    { from: 'judging', to: 'confirmed_human' },
    { from: 'judging', to: 'review' },
    { from: 'judging', to: 'rejected' },
    { from: 'judging', to: 'asking' },
    { from: 'review', to: 'confirmed_human' },
    { from: 'asking', to: 'pending' },
    { from: 'confirmed_human', to: 'pending' },
  ];

  useEffect(() => {
    const fetchCounts = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('decision');

      if (!error && data) {
        const counts: Record<string, number> = {
          received: data.filter(b => !b.decision).length,
          pending: data.filter(b => b.decision === 'pending').length,
          judging: 0,
          confirmed_auto: data.filter(b => b.decision === 'confirmed_auto').length,
          confirmed_human: data.filter(b => b.decision === 'confirmed_human').length,
          review: data.filter(b => b.decision === 'review').length,
          rejected: data.filter(b => b.decision === 'rejected').length,
          asking: data.filter(b => b.decision === 'asking').length,
        };

        setNodes(
          nodeDefinitions.map(n => ({
            ...n,
            count: counts[n.id] || 0,
          }))
        );
      }
    };

    fetchCounts();

    // Realtime 구독
    const channel = supabase
      .channel('bookings-workflow-graph')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNodeClick = (nodeId: string) => {
    // 노드 클릭 시 해당 상태로의 마지막 전이를 강조
    const matchingEdge = edges.find(e => e.to === nodeId);
    if (matchingEdge) {
      setHighlightedEdge({ ...matchingEdge, highlight: true });

      if (highlightTimeout) clearTimeout(highlightTimeout);
      const timeout = setTimeout(() => {
        setHighlightedEdge(null);
      }, 2000);
      setHighlightTimeout(timeout);
    }
  };

  const svgWidth = 620;
  const svgHeight = 220;
  const nodeRadius = 30;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">워크플로 현황</h3>
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="border border-slate-100 rounded-lg">
        {/* 화살표 정의 */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
          </marker>
          <marker
            id="arrowhead-highlight"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>

        {/* 화살표 그리기 */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isHighlighted = highlightedEdge?.from === edge.from && highlightedEdge?.to === edge.to;
          const strokeWidth = isHighlighted ? 3 : 1.5;
          const stroke = isHighlighted ? '#3b82f6' : '#cbd5e1';
          const marker = isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)';

          return (
            <line
              key={idx}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              markerEnd={marker}
            />
          );
        })}

        {/* 노드 그리기 */}
        {nodes.map(node => (
          <g key={node.id} onClick={() => handleNodeClick(node.id)} style={{ cursor: 'pointer' }}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={node.color}
              stroke={node.id === 'judging' ? '#000' : '#cbd5e1'}
              strokeWidth={node.id === 'judging' ? 2 : 1}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dy="0.3em"
              className="text-xs font-bold"
              pointerEvents="none"
            >
              {node.count}
            </text>
            <text
              x={node.x}
              y={node.y + nodeRadius + 14}
              textAnchor="middle"
              className="text-xs font-medium"
              fill="#475569"
              pointerEvents="none"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
