import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
} from "lucide-react";
import { fetchSubgraph, fetchGraphStats } from "../api/researchApi.js";

const NODE_COLORS = {
  Paper: "#3b82f6", // Blue
  Method: "#10b981", // Emerald
  ResearchProblem: "#f43f5e", // Rose
  Dataset: "#f59e0b", // Amber
  Author: "#8b5cf6", // Violet
  ResearchTopic: "#6366f1", // Indigo
  ScientificConcept: "#14b8a6", // Teal
  ResearchTask: "#06b6d4", // Cyan
};

const ALL_NODE_TYPES = [
  "Method",
  "ResearchProblem",
  "Paper",
  "Dataset",
  "Author",
  "ResearchTopic",
  "ScientificConcept",
  "ResearchTask",
];

export default function KnowledgeGraphExplorer({ sessionId, defaultCutoff }) {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Filters - All node types enabled by default
  const [selectedTypes, setSelectedTypes] = useState(new Set(ALL_NODE_TYPES));
  const [cutoffYear, setCutoffYear] = useState(defaultCutoff || 2026);
  const [showAllYears, setShowAllYears] = useState(!defaultCutoff);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);

  // Canvas / Viewport
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load graph data
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const params = showAllYears ? {} : { cutoffYear };
        const [subgraph, graphStats] = await Promise.all([
          fetchSubgraph(sessionId, params),
          fetchGraphStats(sessionId, params),
        ]);
        if (mounted) {
          setGraphData(subgraph);
          setStats(graphStats);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [sessionId, cutoffYear, showAllYears]);

  // Filtered nodes and edges
  const filteredGraph = useMemo(() => {
    const activeNodes = (graphData.nodes || []).filter((node) => {
      if (!selectedTypes.has(node.nodeType)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          node.name.toLowerCase().includes(query) ||
          node.nodeType.toLowerCase().includes(query)
        );
      }
      return true;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.canonicalId));
    const activeEdges = (graphData.edges || []).filter(
      (e) => activeNodeIds.has(e.sourceCanonicalId) && activeNodeIds.has(e.targetCanonicalId)
    );

    return { nodes: activeNodes, edges: activeEdges };
  }, [graphData, selectedTypes, searchQuery]);

  // Connected edges and neighbor IDs for highlighted selection
  const connectedContext = useMemo(() => {
    if (!selectedNode) return { edgeIndices: new Set(), neighborIds: new Set() };
    const selId = selectedNode.canonicalId;
    const edgeIndices = new Set();
    const neighborIds = new Set();

    filteredGraph.edges.forEach((edge, idx) => {
      if (edge.sourceCanonicalId === selId) {
        edgeIndices.add(idx);
        neighborIds.add(edge.targetCanonicalId);
      } else if (edge.targetCanonicalId === selId) {
        edgeIndices.add(idx);
        neighborIds.add(edge.sourceCanonicalId);
      }
    });

    return { edgeIndices, neighborIds };
  }, [selectedNode, filteredGraph.edges]);

  // Compute 2D node layout coordinates with category clustering
  const nodePositions = useMemo(() => {
    const positions = new Map();
    const count = filteredGraph.nodes.length;
    if (count === 0) return positions;

    const width = 880;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;

    // Center the main ResearchTopic node if it exists
    const topicNodes = filteredGraph.nodes.filter((n) => n.nodeType === "ResearchTopic");
    topicNodes.forEach((n, idx) => {
      positions.set(n.canonicalId, { x: centerX, y: centerY + idx * 30 });
    });

    // Group other nodes by type
    const byType = new Map();
    filteredGraph.nodes.forEach((n) => {
      if (n.nodeType === "ResearchTopic") return;
      if (!byType.has(n.nodeType)) byType.set(n.nodeType, []);
      byType.get(n.nodeType).push(n);
    });

    const activeTypes = Array.from(byType.keys());
    activeTypes.forEach((type, typeIdx) => {
      const typeNodes = byType.get(type);
      const orbitBase = 110 + (typeIdx % 3) * 65;
      const baseAngle = (2 * Math.PI * typeIdx) / activeTypes.length;

      typeNodes.forEach((node, nIdx) => {
        const span = (Math.PI * 1.8) / Math.max(1, typeNodes.length);
        const angle = baseAngle + (nIdx - typeNodes.length / 2) * span;
        const jitter = ((nIdx % 3) - 1) * 20;
        const r = orbitBase + jitter;

        positions.set(node.canonicalId, {
          x: Math.max(40, Math.min(width - 40, centerX + r * Math.cos(angle))),
          y: Math.max(40, Math.min(height - 40, centerY + r * Math.sin(angle))),
        });
      });
    });

    return positions;
  }, [filteredGraph.nodes]);

  // Toggle node type filter
  function toggleType(type) {
    const next = new Set(selectedTypes);
    if (next.has(type)) {
      if (next.size > 1) next.delete(type);
    } else {
      next.add(type);
    }
    setSelectedTypes(next);
  }

  function selectAllTypes() {
    setSelectedTypes(new Set(ALL_NODE_TYPES));
  }

  // Canvas Mouse Dragging (Panning)
  function handleMouseDown(e) {
    if (e.target.tagName.toLowerCase() === "circle" || e.target.tagName.toLowerCase() === "text") return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }

  function handleMouseMove(e) {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }

  function handleMouseUp() {
    isDraggingRef.current = false;
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Header and Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-brand-600" />
            Temporal Citation Knowledge Graph (TCKG)
          </h3>
          <p className="text-xs text-slate-500">
            Comprehensive heterogeneous graph representing scientific entities, methods, datasets, problems, and evidence links.
          </p>
        </div>

        {/* Graph Stats pill */}
        {stats && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
              {stats.totalNodes || filteredGraph.nodes.length} Nodes
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-800">
              {stats.totalEdges || filteredGraph.edges.length} Relationships
            </span>
            {stats.neo4jConnected ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Neo4j Connected
              </span>
            ) : (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 border border-blue-200">
                MongoDB Graph Store
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4 bg-slate-50 p-3.5 rounded-xl text-xs border border-slate-200/60">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity name, method, problem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Temporal Cutoff Slider & Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showAllYears}
              onChange={(e) => setShowAllYears(e.target.checked)}
              className="rounded accent-brand-600 h-3.5 w-3.5"
            />
            <span>All Years (Full Graph)</span>
          </label>

          {!showAllYears && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-slate-600">Cutoff:</span>
              <span className="rounded bg-brand-100 px-1.5 py-0.5 font-bold text-brand-700">
                &le; {cutoffYear}
              </span>
              <input
                type="range"
                min="2018"
                max="2026"
                step="1"
                value={cutoffYear}
                onChange={(e) => setCutoffYear(Number(e.target.value))}
                className="h-1.5 w-24 accent-brand-600 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            title="Zoom In"
            className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-100 shadow-2xs"
          >
            <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            title="Zoom Out"
            className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-100 shadow-2xs"
          >
            <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="rounded-md border border-slate-200 bg-white p-1 hover:bg-slate-100 shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Node Type Legend Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Entity Filter:
        </span>
        {ALL_NODE_TYPES.map((type) => {
          const active = selectedTypes.has(type);
          const color = NODE_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              style={{
                borderColor: active ? color : "#cbd5e1",
                backgroundColor: active ? `${color}18` : "#ffffff",
                color: active ? color : "#64748b",
              }}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition cursor-pointer"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {type}
            </button>
          );
        })}
        {selectedTypes.size < ALL_NODE_TYPES.length && (
          <button
            onClick={selectAllTypes}
            className="text-[11px] text-brand-600 font-semibold hover:underline ml-1"
          >
            Select All
          </button>
        )}
      </div>

      {/* Main Graph Visualization Area */}
      <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div
          className="lg:col-span-3 relative h-[580px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 cursor-grab active:cursor-grabbing select-none shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Rendering knowledge graph snapshot...
            </div>
          ) : filteredGraph.nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              No graph entities found matching the selected filters.
            </div>
          ) : (
            <svg
              ref={canvasRef}
              width="100%"
              height="100%"
              className="w-full h-full"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="14"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
                </marker>
                <marker
                  id="arrowhead-highlight"
                  markerWidth="10"
                  markerHeight="7"
                  refX="16"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {filteredGraph.edges.map((edge, i) => {
                  const srcPos = nodePositions.get(edge.sourceCanonicalId);
                  const tgtPos = nodePositions.get(edge.targetCanonicalId);
                  if (!srcPos || !tgtPos) return null;

                  const isHighlighted = connectedContext.edgeIndices.has(i);
                  const isDimmed = selectedNode && !isHighlighted;

                  return (
                    <line
                      key={`edge-${i}`}
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke={isHighlighted ? "#38bdf8" : "#475569"}
                      strokeWidth={isHighlighted ? "2.5" : "1"}
                      strokeOpacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.45}
                      strokeDasharray={edge.verificationStatus === "inferred" ? "3,3" : "none"}
                      markerEnd={isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                      className="transition-all duration-150"
                    />
                  );
                })}

                {/* Nodes */}
                {filteredGraph.nodes.map((node) => {
                  const pos = nodePositions.get(node.canonicalId);
                  if (!pos) return null;

                  const isSelected = selectedNode?.canonicalId === node.canonicalId;
                  const isNeighbor = connectedContext.neighborIds.has(node.canonicalId);
                  const isDimmed = selectedNode && !isSelected && !isNeighbor;
                  const color = NODE_COLORS[node.nodeType] || "#94a3b8";

                  return (
                    <g
                      key={node.canonicalId}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer"
                      opacity={isDimmed ? 0.25 : 1}
                    >
                      <circle
                        r={isSelected ? 16 : isNeighbor ? 12 : 9}
                        fill={color}
                        stroke={isSelected ? "#ffffff" : isNeighbor ? "#38bdf8" : "#0f172a"}
                        strokeWidth={isSelected ? "3" : isNeighbor ? "2" : "1.2"}
                        className="transition-all duration-150 shadow-lg"
                      />
                      <text
                        y={isSelected ? 26 : 20}
                        textAnchor="middle"
                        fill={isSelected ? "#38bdf8" : "#f1f5f9"}
                        fontSize={isSelected ? "11px" : "9px"}
                        fontWeight={isSelected || isNeighbor ? "bold" : "normal"}
                        className="pointer-events-none drop-shadow"
                      >
                        {node.name.length > 20 ? `${node.name.slice(0, 18)}...` : node.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            Click entity to inspect provenance &middot; Drag to pan &middot; Zoom with buttons
          </div>
        </div>

        {/* Node Details Inspector Drawer */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-slate-50 p-4 overflow-y-auto max-h-[580px]">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    style={{
                      backgroundColor: `${NODE_COLORS[selectedNode.nodeType]}20`,
                      color: NODE_COLORS[selectedNode.nodeType],
                    }}
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {selectedNode.nodeType}
                  </span>
                  <h4 className="mt-1 font-bold text-slate-900 text-sm">{selectedNode.name}</h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              {selectedNode.description && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Description / Scope
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-400">First Seen Year:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedNode.firstSeenYear || "n.d."}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <div className="font-semibold capitalize text-emerald-600">
                    {selectedNode.verificationStatus || "Observed"}
                  </div>
                </div>
              </div>

              {/* Connected Relationships in Subgraph */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Connected Graph Relationships ({connectedContext.edgeIndices.size})
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Array.from(connectedContext.edgeIndices).map((edgeIdx) => {
                    const edge = filteredGraph.edges[edgeIdx];
                    if (!edge) return null;
                    const isOutgoing = edge.sourceCanonicalId === selectedNode.canonicalId;
                    const otherNode = filteredGraph.nodes.find(
                      (n) => n.canonicalId === (isOutgoing ? edge.targetCanonicalId : edge.sourceCanonicalId)
                    );

                    return (
                      <div
                        key={edgeIdx}
                        className="rounded-lg bg-white p-2 border border-slate-200/60 text-[11px]"
                      >
                        <div className="font-semibold text-brand-700 text-[10px]">
                          {isOutgoing ? "&rarr;" : "&larr;"} {edge.edgeType}
                        </div>
                        <div className="text-slate-800 font-medium truncate">
                          {otherNode?.name || "Connected Entity"}
                        </div>
                        {edge.evidenceText && (
                          <div className="mt-1 text-[10px] text-slate-500 italic line-clamp-2">
                            "{edge.evidenceText}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-10">
              <Info className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">No Entity Selected</p>
              <p className="mt-1 text-[11px] text-slate-400 max-w-[200px]">
                Click any node in the graph to inspect scientific relationships and provenance evidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
