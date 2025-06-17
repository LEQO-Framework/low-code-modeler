import React, { useState } from "react";
import { categories, Node } from "./categories";
import useStore from "@/config/store";
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

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, node: any) => {
    event.dataTransfer.setData("application/reactflow", node.type);
    event.dataTransfer.setData("application/reactflow/dataType", node.dataType);
    event.dataTransfer.setData("application/reactflow/label", node.label);
    event.dataTransfer.effectAllowed = "move";
    console.log("drag start", node);
  };

  const toggleCategory = (category: string) => {
    setActiveCategory((prevCategory) =>
      prevCategory === category ? null : category
    );
  };

  const allNodes = Object.values(categories).flatMap((subcategories) => {
    if (Array.isArray(subcategories)) {
      // categories like controlStructureNodes and customOperators
      return subcategories;
    } else {
      // categories that are objects containing groups
      return Object.values(subcategories).flatMap((group) =>
        Array.isArray(group)
          ? group
          : Object.values(group).flat()
      );
    }
  });


  const filteredNodes = searchQuery
    ? allNodes.filter((node: Node) => {
      console.log(node);
      return node.label.toLowerCase().startsWith(searchQuery.toLowerCase()) &&
        !(!ancillaMode && node.type === "ancillaNode")
    }
    )
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
              >
                {node.icon ? (
                    <img 
    src={node.icon} 
    alt={typeof node.label === "string" ? node.label : ""}
    className={`object-contain ${
      node.type === consts.GateNode 
        ? "w-[120px] h-[140px]" 
        : (node.type === consts.SplitterNode || node.type === consts.MergerNode) 
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
    <div className="h-[calc(100vh_-_60px)] w-full bg-gray-100 overflow-hidden">
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
            {filteredNodes.length > 0 ? (
              <div className="space-y-2">
                {filteredNodes.map((node: Node) => (
                  <div
                    key={node.label}
                    className="border border-gray-300 bg-gray-50 text-black-700 hover:border-gray-400 hover:bg-gray-100 py-2 px-3 rounded-md cursor-pointer flex flex-col items-center gap-2 transition-colors"
                    onDragStart={(event) => onDragStart(event, node)}
                    draggable
                  >
                    {node.icon ? (
                      <img src={node.icon} alt={node.label} className="w-70 h-70 object-contain" />
                    ) : (
                      <span className="font-semibold">{node.label}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No matching nodes found.</p>
            )}
          </div>
        )}

        <nav className="space-y-4">
          {Object.entries(categories).map(([category, content]) => (
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