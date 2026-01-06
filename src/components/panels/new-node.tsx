import React, { useState, useMemo, useEffect } from "react";
import { categories, Node } from "./categories";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import * as consts from "../../constants";

const selector = (state: {
  ancillaMode: boolean;
}) => ({
  ancillaMode: state.ancillaMode,
});

const categoryIcons: Record<string, string> = {
  [consts.boundaryNodes]: "BoundaryNodes.png",
  [consts.circuitLevelNodes]: "CircuitLevelNodes.png",
  [consts.controlStructureNodes]: "ControlStructureNodes.png",
  [consts.customOperators]: "CustomOperators.png",
  [consts.operator]: "Operators.png",
  [consts.dataTypes]: "DataTypes.png",
};

export const AddNodePanel = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { ancillaMode } = useStore(selector, shallow);

  // Plugin loading state
  const [mlPlugins, setMlPlugins] = useState<any[]>([]);
  const [pluginsLoading, setPluginsLoading] = useState(true);

  // Load ML plugins from Plugin Runner
  useEffect(() => {
    const pluginRunnerUrl = import.meta.env.VITE_LOW_CODE_BACKEND?.replace(/\/plugins\/.*$/, '') || "http://localhost:5005";

    const fetchPlugins = async () => {
      try {
        setPluginsLoading(true);
        const response = await fetch(`${pluginRunnerUrl}/plugins/`);
        if (!response.ok) throw new Error('Failed to fetch plugins');

        const data = await response.json();
        const allPlugins = data.plugins || [];

        // Filter for ML plugins by tags (only clustering and classification)
        const mlTags = ["clustering", "classification"];
        const filtered = allPlugins.filter((plugin: any) =>
          plugin.tags?.some((tag: string) => mlTags.includes(tag))
        );

        setMlPlugins(filtered);
      } catch (error) {
        console.error("Error loading plugins:", error);
        setMlPlugins([]);
      } finally {
        setPluginsLoading(false);
      }
    };

    fetchPlugins();
  }, []);

  // Define mock inputs/outputs for ML plugins (until Plugin Runner metadata is available)
  const getMockPluginMetadata = (pluginName: string) => {
    switch (pluginName) {
      case 'classical-k-means':
      case 'quantum-k-means':
        return {
          dataInputs: [
            {
              parameter: 'entityPointsUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'numberOfClusters',
              data_type: 'int',
              content_type: ['text/plain'],
              required: true,
            },
            {
              parameter: 'variant',
              data_type: 'string',
              content_type: ['text/plain'],
              required: pluginName === 'quantum-k-means',
            },
            {
              parameter: 'tolerance',
              data_type: 'float',
              content_type: ['text/plain'],
              required: false,
            },
            {
              parameter: 'maxIterations',
              data_type: 'int',
              content_type: ['text/plain'],
              required: false,
            },
          ],
          dataOutputs: [
            {
              name: 'Cluster Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
            {
              name: 'Visualization',
              data_type: 'plot',
              content_type: ['text/html'],
              required: false,
            },
          ],
        };

      case 'quantum-k-nearest-neighbours':
        return {
          dataInputs: [
            {
              parameter: 'trainingDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'trainingLabelsUrl',
              data_type: 'entity/label',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'testDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'k',
              data_type: 'int',
              content_type: ['text/plain'],
              required: true,
            },
          ],
          dataOutputs: [
            {
              name: 'Predicted Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
          ],
        };

      case 'classical-k-medoids':
        return {
          dataInputs: [
            {
              parameter: 'entityPointsUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'numberOfClusters',
              data_type: 'int',
              content_type: ['text/plain'],
              required: true,
            },
            {
              parameter: 'maxIterations',
              data_type: 'int',
              content_type: ['text/plain'],
              required: false,
            },
          ],
          dataOutputs: [
            {
              name: 'Cluster Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
          ],
        };

      case 'optics':
        return {
          dataInputs: [
            {
              parameter: 'entityPointsUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'minSamples',
              data_type: 'int',
              content_type: ['text/plain'],
              required: true,
            },
            {
              parameter: 'maxEps',
              data_type: 'float',
              content_type: ['text/plain'],
              required: false,
            },
          ],
          dataOutputs: [
            {
              name: 'Cluster Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
          ],
        };

      case 'qnn':
        return {
          dataInputs: [
            {
              parameter: 'trainingDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'trainingLabelsUrl',
              data_type: 'entity/label',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'testDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'epochs',
              data_type: 'int',
              content_type: ['text/plain'],
              required: false,
            },
          ],
          dataOutputs: [
            {
              name: 'Predicted Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
          ],
        };

      case 'quantum-cnn':
        return {
          dataInputs: [
            {
              parameter: 'trainingDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'trainingLabelsUrl',
              data_type: 'entity/label',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'testDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'epochs',
              data_type: 'int',
              content_type: ['text/plain'],
              required: false,
            },
          ],
          dataOutputs: [
            {
              name: 'Predicted Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
          ],
        };

      case 'quantum-parzen-window':
        return {
          dataInputs: [
            {
              parameter: 'trainingDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'trainingLabelsUrl',
              data_type: 'entity/label',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'testDataUrl',
              data_type: 'entity/vector',
              content_type: ['application/json', 'text/csv'],
              required: true,
            },
            {
              parameter: 'bandwidth',
              data_type: 'float',
              content_type: ['text/plain'],
              required: false,
            },
          ],
          dataOutputs: [
            {
              name: 'Predicted Labels',
              data_type: 'entity/label',
              content_type: ['application/json'],
              required: true,
            },
          ],
        };

      default:
        return { dataInputs: [], dataOutputs: [] };
    }
  };

  // Get icon for plugin based on name/tags - using Pattern Atlas icons
  const getPluginIcon = (plugin: any) => {
    const name = plugin.name.toLowerCase();
    const tags = plugin.tags || [];

    // Pattern Atlas icon base URL (served from Pattern Atlas UI)
    const patternAtlasIconBase = import.meta.env.VITE_PATTERN_ATLAS_UI || 'http://localhost:1978';
    const iconPath = `${patternAtlasIconBase}/icons/quantum_computing_patterns`;

    // Specific plugin icons (most specific first)

    // K-Means (classical and quantum) - specific icon
    if (name.includes('k-means') || name === 'classical-k-means' || name === 'quantum-k-means') {
      return `${iconPath}/kmeans_icon.png`;
    }

    // Neural Networks (QNN, CNN) - specific icon
    if (name.includes('qnn') || name.includes('neural') || name.includes('-cnn')) {
      return `${iconPath}/quantum_neural_network-thin.svg`;
    }

    // Parzen Window / Kernel methods - SVM-like icon
    if (name.includes('parzen') || name.includes('kernel')) {
      return `${iconPath}/qsvm_icon.png`;
    }

    // K-Medoids - clustering icon
    if (name.includes('medoid')) {
      return `${iconPath}/quantum_clustering-thin.svg`;
    }

    // OPTICS - clustering icon
    if (name.includes('optics')) {
      return `${iconPath}/quantum_clustering-thin.svg`;
    }

    // K-Nearest Neighbours - clustering icon
    if (name.includes('k-nearest') || name.includes('knn')) {
      return `${iconPath}/quantum_clustering-thin.svg`;
    }

    // Generic fallback based on tags
    if (tags.includes('clustering')) {
      return `${iconPath}/quantum_clustering-thin.svg`;
    }

    if (tags.includes('classification')) {
      return `${iconPath}/quantum_classification-thin.svg`;
    }

    return undefined;
  };

  // Create dynamic categories with ML plugins
  const dynamicCategories = useMemo(() => {
    const cats = { ...categories };

    // Populate Machine Learning Nodes category with ML plugins only
    if (mlPlugins.length > 0) {
      cats[consts.machineLearningNodes] = {
        description: "Machine learning and quantum machine learning plugins from the QHAna Plugin Runner.",
        content: mlPlugins.map(plugin => {
          const mockMetadata = getMockPluginMetadata(plugin.name);
          return {
            label: plugin.name,
            type: consts.PluginNode,
            description: plugin.description,
            icon: getPluginIcon(plugin), // Pattern Atlas icon
            pluginData: {
              ...plugin,
              // Add mock metadata to pluginData so it's available in the drag handler
              mockDataInputs: mockMetadata.dataInputs,
              mockDataOutputs: mockMetadata.dataOutputs,
            },
          };
        })
      };
    }

    return cats;
  }, [mlPlugins]);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, node: any) => {
    event.dataTransfer.setData("application/reactflow", node.type);
    event.dataTransfer.setData("application/reactflow/dataType", node.dataType);
    event.dataTransfer.setData("application/reactflow/label", node.label);

    // For plugin nodes, store additional metadata
    if (node.type === consts.PluginNode && node.pluginData) {
      event.dataTransfer.setData("application/reactflow/pluginData", JSON.stringify(node.pluginData));
    }

    event.dataTransfer.effectAllowed = "move";
    console.log("drag start", node);
  };

  const toggleCategory = (category: string) => {
    setActiveCategory((prevCategory) =>
      prevCategory === category ? null : category
    );
  };

  const allNodes = Object.values(dynamicCategories).flatMap(({ content }) => {
    if (Array.isArray(content)) {
      return content;
    } else {
      return Object.values(content).flatMap((group) =>
        Array.isArray(group)
          ? group
          : Object.values(group).flat()
      );
    }
  });


  const filteredNodes = searchQuery
  ? allNodes.filter((node: Node) => {
      console.log(node);
      return node.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(!ancillaMode && node.type === "ancillaNode")
    })
  : [];

  const renderNodes = (nodeGroup: any): React.ReactNode => {
    if (Array.isArray(nodeGroup)) {
      return (
        <div className="space-y-2 mt-2">
          {nodeGroup
            .filter((node: Node) => !(!ancillaMode && node.type === "ancillaNode"))
            .map((node: Node) => (
              <div
                key={node.label}
                className="group bg-gray-50 text-black-700 hover:border-gray-400 hover:bg-gray-100 py-2 px-3 rounded-md cursor-pointer flex flex-col items-center gap-2 transition-colors"
                onDragStart={(event) => onDragStart(event, node)}
                draggable
                title={node.description || node.label}
              >
                {node.icon ? (
                  <img
                    src={
                      Array.isArray(node.icon)
                        ? node.icon[ancillaMode ? 1 : 0]
                        : node.icon
                    }
                    alt={typeof node.label === "string" ? node.label : ""}
                    className={`object-contain ${node.type === consts.GateNode
                      ? "w-[120px] h-[140px]"
                      : node.type === consts.SplitterNode || node.type === consts.MergerNode
                        ? "w-[190px] h-[190px]"
                        : "w-70 h-70"
                      }`}
                  />
                ) : (
                  <span className="font-semibold">{node.label}</span>
                )}
              </div>
            ))}
        </div>
      );
    }

    return (
      <div className="pl-4 space-y-4">
        {Object.entries(nodeGroup).map(([subSubCategory, subSubGroup]) => (
          <div key={subSubCategory}>
            <div className="text-sm font-semibold text-gray-700 mt-2">{subSubCategory}</div>
            {renderNodes(subSubGroup)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="palette-container h-[calc(100vh_-_60px)] w-full bg-gray-100 overflow-hidden">
      <aside className="flex flex-col w-full h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <input
          type="text"
          placeholder="Search nodes..."
          className="mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {searchQuery && (
          <div className="mb-4">
            {filteredNodes.map((node: Node) => (
              <div
                key={node.label}
                className="border border-gray-300 bg-gray-50 text-black-700 hover:border-gray-400 hover:bg-gray-100 py-2 px-3 rounded-md cursor-pointer flex flex-col items-center gap-2 transition-colors"
                onDragStart={(event) => onDragStart(event, node)}
                draggable
                title={node.description || node.label}
              >
                {node.icon ? (
                  <img
                    src={
                      Array.isArray(node.icon)
                        ? node.icon[ancillaMode ? 1 : 0]
                        : node.icon
                    }
                    alt={node.label}
                    className="w-70 h-70 object-contain"
                    
                  />
                ) : (
                  <span className="font-semibold">{node.label}</span>
                )}
              </div>
            ))}

          </div>
        )}

        <nav className="space-y-4">
          {pluginsLoading && (
            <div className="text-sm text-gray-500 px-4 py-2">
              Loading plugins...
            </div>
          )}
          {Object.entries(dynamicCategories).map(([category, { content, description }]) => (

            <div key={category}>
              <button
                className={`w-full text-left py-2 px-4 font-semibold text-black-700 border-b ${activeCategory === category ? "bg-gray-100 text-primary" : "hover:bg-gray-300"
                  }`}
                onClick={() => toggleCategory(category)}

              >
                <div className="flex items-center gap-2">
                  {categoryIcons[category] && (
                    <img
                      src={categoryIcons[category]}
                      alt={`${category} icon`}
                      className="w-9 h-9"
                    />
                  )}
                  <span>{category}</span>
                </div>
                {description && (
                  <div className="text-sm text-gray-600 mt-1 ml-11">{description}</div>
                )}
              </button>

              {activeCategory === category && (
                <div className="pl-4 mt-2 space-y-4">
                  {Array.isArray(content) ? (
                    renderNodes(content)
                  ) : (
                    Object.entries(content).map(([subcategory, subGroup]) => (
                      <div key={subcategory}>
                        <div className="text-md font-bold text-gray-800 mt-2">{subcategory}</div>
                        {renderNodes(subGroup)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}