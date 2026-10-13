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

  // Filters
  const [selectedTypes, setSelectedTypes] = useState(
    new Set(["Method", "ResearchProblem", "Paper", "Dataset", "ResearchTopic"])
  );
  const [cutoffYear, setCutoffYear] = useState(defaultCutoff || 2024);
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
        const [subgraph, graphStats] = await Promise.all([
          fetchSubgraph(sessionId, { cutoffYear }),
          fetchGraphStats(sessionId, { cutoffYear }),
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
  }, [sessionId, cutoffYear]);

  // Filtered nodes and edges
  const filteredGraph = useMemo(() => {
    const activeNodes = graphData.nodes.filter((node) => {
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
    const activeEdges = graphData.edges.filter(
      (e) => activeNodeIds.has(e.sourceCanonicalId) && activeNodeIds.has(e.targetCanonicalId)
    );

    return { nodes: activeNodes, edges: activeEdges };
  }, [graphData, selectedTypes, searchQuery]);

  // Compute 2D node layout coordinates with deterministic circular + force repulsion
  const nodePositions = useMemo(() => {
    const positions = new Map();
    const count = filteredGraph.nodes.length;
    if (count === 0) return positions;

    const width = 800;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    filteredGraph.nodes.forEach((node, i) => {
      // Group by node type in radial clusters
      const typeIndex = ALL_NODE_TYPES.indexOf(node.nodeType);
      const angle = (2 * Math.PI * i) / count;
      const radius = 140 + (typeIndex % 3) * 60;
      positions.set(node.canonicalId, {
        x: centerX + radius * Math.cos(angle) + (Math.sin(i) * 20),
        y: centerY + radius * Math.sin(angle) + (Math.cos(i) * 20),
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

  // Canvas Mouse Dragging (Panning)
  function handleMouseDown(e) {
    if (e.target.tagName.toLowerCase() === "circle") return;
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header and Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-brand-600" />
            Temporal Citation Knowledge Graph (TCKG)
          </h3>
          <p className="text-xs text-slate-500">
            Interactive heterogeneous graph showing scientific entities, provenance, and relationships.
          </p>
        </div>

        {/* Graph Stats pill */}
        {stats && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              {stats.totalNodes} Nodes
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              {stats.totalEdges} Edges
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              Density: {stats.density}
            </span>
            {stats.neo4jConnected ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Neo4j Connected
              </span>
            ) : (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                MongoDB Graph Store
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Temporal Cutoff Slider */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Cutoff Year:</span>
          <span className="rounded bg-brand-100 px-1.5 py-0.5 font-bold text-brand-700">
            &le; {cutoffYear}
          </span>
          <input
            type="range"
            min="2017"
            max="2024"
            step="1"
            value={cutoffYear}
            onChange={(e) => setCutoffYear(Number(e.target.value))}
            className="h-1.5 w-24 accent-brand-600 cursor-pointer"
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            title="Zoom In"
            className="rounded border border-slate-200 bg-white p-1 hover:bg-slate-100"
          >
            <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            title="Zoom Out"
            className="rounded border border-slate-200 bg-white p-1 hover:bg-slate-100"
          >
            <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="rounded border border-slate-200 bg-white p-1 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Node Type Legend Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Entity Types:
        </span>
        {ALL_NODE_TYPES.map((type) => {
          const active = selectedTypes.has(type);
          const color = NODE_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              style={{
                borderColor: active ? color : "#e2e8f0",
                backgroundColor: active ? `${color}15` : "#ffffff",
                color: active ? color : "#94a3b8",
              }}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {type}
            </button>
          );
        })}
      </div>

      {/* Main Graph Visualization Area */}
      <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div
          className="lg:col-span-3 relative h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-slate-900 cursor-grab active:cursor-grabbing select-none"
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
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {filteredGraph.edges.map((edge, i) => {
                  const srcPos = nodePositions.get(edge.sourceCanonicalId);
                  const tgtPos = nodePositions.get(edge.targetCanonicalId);
                  if (!srcPos || !tgtPos) return null;

                  return (
                    <g key={`edge-${i}`} className="opacity-60 hover:opacity-100 transition">
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        stroke="#64748b"
                        strokeWidth="1.2"
                        strokeDasharray={edge.verificationStatus === "inferred" ? "3,3" : "none"}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {filteredGraph.nodes.map((node) => {
                  const pos = nodePositions.get(node.canonicalId);
                  if (!pos) return null;

                  const isSelected = selectedNode?.canonicalId === node.canonicalId;
                  const color = NODE_COLORS[node.nodeType] || "#94a3b8";

                  return (
                    <g
                      key={node.canonicalId}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer"
                    >
                      <circle
                        r={isSelected ? 16 : 10}
                        fill={color}
                        stroke={isSelected ? "#ffffff" : "#0f172a"}
                        strokeWidth={isSelected ? "3" : "1.5"}
                        className="transition-all duration-150"
                      />
                      <text
                        y={isSelected ? 26 : 20}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={isSelected ? "11px" : "9px"}
                        fontWeight={isSelected ? "bold" : "normal"}
                        className="pointer-events-none drop-shadow"
                      >
                        {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
            Click nodes to inspect provenance &middot; Drag to pan &middot; Scroll/buttons to zoom
          </div>
        </div>

        {/* Node Details Inspector Drawer */}
        <div className="lg:col-span-1 rounded-lg border border-slate-200 bg-slate-50 p-4 overflow-y-auto max-h-[560px]">
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    style={{
                      backgroundColor: `${NODE_COLORS[selectedNode.nodeType]}20`,
                      color: NODE_COLORS[selectedNode.nodeType],
                    }}
                    className="rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  >
                    {selectedNode.nodeType}
                  </span>
                  <h4 className="mt-1.5 font-bold text-slate-900 text-sm">
                    {selectedNode.name}
                  </h4>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-200 pt-2">
                <p>
                  <span className="font-semibold text-slate-700">Canonical ID:</span>{" "}
                  <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">
                    {selectedNode.canonicalId}
                  </code>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">First Seen:</span>{" "}
                  {selectedNode.firstSeenYear || "n.d."}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Status:</span>{" "}
                  <span
                    className={`font-medium ${
                      selectedNode.verificationStatus === "observed"
                        ? "text-blue-700"
                        : "text-amber-700"
                    }`}
                  >
                    {selectedNode.verificationStatus || "inferred"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Confidence:</span>{" "}
                  {Math.round((selectedNode.extractionConfidence ?? 0.9) * 100)}%
                </p>
              </div>

              {selectedNode.description && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-xs font-semibold text-slate-700">Description:</span>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              {/* Connected Edges */}
              <div className="border-t border-slate-200 pt-2">
                <span className="text-xs font-semibold text-slate-700">Relationships:</span>
                <div className="mt-1.5 space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredGraph.edges
                    .filter(
                      (e) =>
                        e.sourceCanonicalId === selectedNode.canonicalId ||
                        e.targetCanonicalId === selectedNode.canonicalId
                    )
                    .map((edge, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-slate-200 bg-white p-2 text-[11px]"
                      >
                        <div className="flex items-center justify-between text-brand-700 font-semibold">
                          <span>{edge.edgeType}</span>
                          <span className="text-slate-400 font-normal">{edge.year}</span>
                        </div>
                        <div className="text-slate-600 mt-0.5 truncate">
                          {edge.sourceCanonicalId === selectedNode.canonicalId
                            ? `-> ${edge.targetCanonicalId}`
                            : `<- ${edge.sourceCanonicalId}`}
                        </div>
                        {edge.evidenceText && (
                          <p className="mt-1 italic text-[10px] text-slate-500 line-clamp-2">
                            "{edge.evidenceText}"
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-12">
              <Info className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium">Select any node in the graph</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Inspect scientific attributes, publication year, evidence text, and provenance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
