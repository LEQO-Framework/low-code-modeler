import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import { categories, CategoryEntry } from "../panels/categories";
import { ImageIcon, Plus, Trash2, CheckCircle2, Circle, ChevronDown, Check, GripVertical } from "lucide-react";
import { boundaryNodes, dataTypes, circuitLevelNodes, controlStructureNodes, templates, operator, customOperators, OperatorNode, EditableNode } from "@/constants";
import { DomainProfileRepositoryPicker } from "./domainProfileRepositoryPicker";
import { RepositoryDomainProfile } from "../../services/domainProfileRepository";

export interface EditableNodeProfile {
  label: string;
  description: string;
  icon: string | string[];
  visible: boolean;
  outputType: string | string[];
  category: string;
  properties: NodeProfileProperty[];
  constraints: NodeProfileConstraint[];
  mapping: string[][];

  originalLabel: string;
  originalDescription: string;
  originalIcon: string | string[];
}

export type DomainProfile = {
  name: string;
  domainBlocks: Record<string, CategoryEntry>;
}

interface NodeProfileProperty {
  name: string;
  type: string;
}
interface NodeProfileConstraint {
  propertyName: string;
  constraint: string;
  value?: string;
}

/**
 * Convert a profile revision from the repository into the editor's flat node
 * list. The repository groups blocks by category, the editor keeps one list and
 * carries the category on each node, so this is the inverse of what Save Profile
 * does. Fields the repository format does not carry, such as the icon, fall back
 * to the same defaults the file import uses.
 */
function toEditableNodes(profile: RepositoryDomainProfile): EditableNodeProfile[] {
  return Object.entries(profile.domainBlocks ?? {}).flatMap(([category, blocks]) =>
    (blocks ?? []).map((block) => ({
      label: block.label,
      description: block.description ?? "",
      icon: "QAOA.png",
      visible: true,
      outputType: "",
      category,
      properties: block.properties ?? [],
      constraints: block.constraints ?? [],
      mapping: [[]],

      originalLabel: block.label,
      originalDescription: block.description ?? "",
      originalIcon: "QAOA.png",
    }))
  );
}

function extractNodes(content: any): EditableNodeProfile[] {
  const nodes: EditableNodeProfile[] = [];

  const walk = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((n) => {
        if (n?.label && n?.description) {
          nodes.push({
            label: n.label,
            description: n.description,
            icon: n.icon,
            visible: true,
            outputType: n.outputType || "",
            category: n.type || "",
            properties: [],
            constraints: [],
            mapping: [[]],

            originalLabel: n.label,
            originalDescription: n.description,
            originalIcon: n.icon,
          });
        }
      });
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  };

  walk(content);
  return nodes;
}

function toEditableNodesFromDomainProfile(profile: DomainProfile): EditableNodeProfile[] {
  return Object.entries(profile.domainBlocks ?? {}).flatMap(([category, entry]: any) => {
    const content = entry?.content ?? [];
    return (Array.isArray(content) ? content : []).map((node: any) => ({
      label: node.label ?? "",
      description: node.description ?? "",
      icon: node.icon ?? "QAOA.png", //TODO: define default Icon 
      visible: node.visible ?? true,
      outputType: node.outputType ?? "",
      category: node.category ?? category ?? "",
      properties: node.properties ?? [],
      constraints: node.constraints ?? [],
      mapping: node.mapping ?? [[]],
      originalLabel: node.originalLabel ?? node.label ?? "",
      originalDescription: node.originalDescription ?? node.description ?? "",
      originalIcon: node.originalIcon ?? node.icon ?? "QAOA.png", //TODO: define default Icon 
    }));
  });
}

function extractNodeLabels(content: any): Record<string, string> {
  const labels: Record<string, string> = {};

  const walk = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((n) => {
        if (n?.label && n?.description) {
          labels[n.label] = n.description;
        }
      });
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  };

  walk(content);
  return labels;
}

function PropertyEditor({
  properties,
  onChange
}: {
  properties: NodeProfileProperty[],
  onChange: (props: NodeProfileProperty[]) => void
}) {

  const addProperty = () => {
    onChange([...properties, { name: "", type: "" }]);
  };

  const updateProperty = (index: number, field: keyof NodeProfileProperty, value: any) => {
    const newProps = [...properties];
    newProps[index] = { ...newProps[index], [field]: value };
    onChange(newProps);
  };

  const removeProperty = (index: number) => {
    onChange(properties.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {properties.map((prop, idx) => (
        <div key={idx} className="p-2 border rounded bg-gray-50 relative group">
          <button
            onClick={() => removeProperty(idx)}
            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
          >
            <Trash2 size={12} />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Name</label>
              <input
                className="w-full border rounded px-1 py-0.5 text-xs"
                value={prop.name}
                onChange={(e) => updateProperty(idx, "name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Type</label>
              <input
                className="w-full border rounded px-1 py-0.5 text-xs"
                value={prop.type}
                onChange={(e) => updateProperty(idx, "type", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addProperty}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors"
      >
        <Plus size={14} /> Add Property
      </button>
    </div>
  );
}

function ConstraintEditor({
  constraints,
  availableProperties,
  onChange
}: {
  constraints: NodeProfileConstraint[],
  availableProperties: NodeProfileProperty[],
  onChange: (props: NodeProfileConstraint[]) => void
}) {
  const constraintOptions = ["==", "!=", "<", ">", "<=", ">=", "is required"]

  const propertyOptions = (availableProperties || []).flatMap(prop => {
    const base = [prop.name];
    // Check if type contains 'array' or '[]'
    if (prop.type.toLowerCase().includes("array") || prop.type.includes("[]")) {
      base.push(`length(${prop.name})`);
    }
    return base;
  });

  const addConstraint = () => {
    onChange([...constraints, { propertyName: "", constraint: "", value: "" }]);
  };

  const updateConstraint = (index: number, field: keyof NodeProfileConstraint, value: any) => {
    const newConstraints = [...constraints];
    const finalValue = field === "constraint" && value === "is required" ? "" :
      field === "value" ? value : newConstraints[index].value;

    newConstraints[index] = { ...newConstraints[index], [field]: value, value: finalValue };
    onChange(newConstraints);
  };

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {constraints.map((con, idx) => {
        const isRequiredType = con.constraint === "is required";

        return (
          <div key={idx} className="p-2 border rounded bg-gray-50 relative group">
            <button
              onClick={() => removeConstraint(idx)}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
            >
              <Trash2 size={12} />
            </button>

            <div className="grid grid-cols-3 gap-2">
              {/* Property Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Property</label>
                <select
                  className="w-full border rounded px-1 py-0.5 text-xs bg-white"
                  value={con.propertyName}
                  onChange={(e) => updateConstraint(idx, "propertyName", e.target.value)}
                >
                  <option value="">Select...</option>
                  {propertyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Constraint */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Constraint</label>
                <select
                  className="w-full border rounded px-1 py-0.5 text-xs bg-white"
                  value={con.constraint}
                  onChange={(e) => updateConstraint(idx, "constraint", e.target.value)}
                >
                  <option value="">Select...</option>
                  {constraintOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {/* Value */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Value</label>
                <input
                  className={`w-full border rounded px-1 py-0.5 text-xs ${isRequiredType ? "bg-gray-200 cursor-not-allowed text-transparent" : "bg-white"}`}
                  value={con.value}
                  disabled={isRequiredType}
                  placeholder={isRequiredType ? "-" : "Value..."}
                  onChange={(e) => updateConstraint(idx, "value", e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <button
        onClick={addConstraint}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors"
      >
        <Plus size={14} /> Add Constraint
      </button>
    </div>
  );
}

const staticMappingOptions = { "Number": "Number", "Array": "Array", "QUBO": "QUBO", "QAOA": "QAOA", "VQE": "VQE", "QAE": "QAE" } // with descriptions
const dynamicMappingOptions = extractNodeLabels(categories);
const mappingOptions: Record<string, string> = {
  ...staticMappingOptions,
  ...dynamicMappingOptions
};

function OutputTypeEditor({
  outputTypes,
  onChange
}: {
  outputTypes: string[],
  onChange: (types: string[]) => void
}) {

  const addType = () => {
    onChange([...outputTypes, ""]);
  };

  const updateType = (index: number, value: string) => {
    const newTypes = [...outputTypes];
    newTypes[index] = value;
    onChange(newTypes);
  };

  const removeType = (index: number) => {
    onChange(outputTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 min-w-[150px]">
      {outputTypes.map((type, idx) => (
        <div key={idx} className="flex items-center gap-1 p-1 border rounded bg-gray-50 relative group">
          <input
            className="flex-1 border rounded px-1 py-0.5 text-xs"
            value={type}
            onChange={(e) => updateType(idx, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeType(idx)}
            className="bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addType}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors"
      >
        <Plus size={14} /> Add Output Type
      </button>
    </div>
  );
}


function MappingGroup({
  selected,
  onToggle,
  onRemove
}: {
  selected: string[],
  onToggle: (val: string) => void,
  onRemove: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mb-2 flex items-center gap-2 group" ref={dropdownRef}>
      <div className="flex-1">
        {/* Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border rounded px-2 py-1.5 text-xs hover:border-blue-400 transition-colors"
        >
          <span>
            {selected.length > 0 ? selected.join(" + ") : "Select mapping..."}
          </span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-[100] mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {Object.entries(mappingOptions).map(([option, desc]) => {
              const isChecked = selected.includes(option);
              return (
                <div
                  key={option}
                  title={desc}
                  onClick={() => onToggle(option)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs"
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${isChecked ? "bg-blue-500 border-blue-500" : "bg-white"}`}>
                    {isChecked && <Check size={10} className="text-white" />}
                  </div>
                  <span className={isChecked ? "font-bold text-blue-700" : "text-gray-700"}>
                    {option}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={onRemove}
        className="bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200" // TODO: evtl.  nicht rot, an templateModal anpassen
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export function MappingEditor({
  mappings,
  onChange
}: {
  mappings: string[][],
  onChange: (newMappings: string[][]) => void
}) {
  const handleToggle = (groupIdx: number, val: string) => {
    const newMappings = [...mappings];
    const currentGroup = newMappings[groupIdx] || [];

    if (currentGroup.includes(val)) {
      newMappings[groupIdx] = currentGroup.filter(v => v !== val);
    } else {
      newMappings[groupIdx] = [...currentGroup, val].sort();
    }
    onChange(newMappings);
  };

  const addGroup = () => onChange([...mappings, []]);

  const removeGroup = (idx: number) => onChange(mappings.filter((_, i) => i !== idx));

  return (
    <div className="min-w-[200px] p-1">
      {mappings.map((group, idx) => (
        <MappingGroup
          key={idx}
          selected={group}
          onToggle={(val) => handleToggle(idx, val)}
          onRemove={() => removeGroup(idx)}
        />
      ))}

      <button
        onClick={addGroup}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-200 rounded text-gray-400 hover:border-blue-300 hover:text-blue-500 text-[10px] transition-all"
      >
        <Plus size={12} /> Add Mapping
      </button>
    </div>
  );
}

export default function DomainProfileTableModal({
  open,
  onClose,
  onSave,
  initialProfile,
  profiles,
  editingProfileIndex,
  onEditProfile,
  onDeleteProfile,
  onReorderProfiles,
  onDuplicateProfile,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (profile: any) => void;
  initialProfile: DomainProfile | null;
  profiles: DomainProfile[];
  editingProfileIndex: number | null;
  onEditProfile: (index: number) => void;
  onDeleteProfile: (index: number) => void;
  onReorderProfiles: (fromIndex: number, toIndex: number) => void;
  onDuplicateProfile: (index: number) => void;
}) {
  const [localNodes, setLocalNodes] = useState<EditableNodeProfile[]>([]);
  const [profileName, setProfileName] = useState("");
  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(null);

  // Reset localNodes and profileName when closed, or load the selected profile while open.
  useEffect(() => {
    if (!open) {
      setLocalNodes([]);
      setProfileName("");
      setDraggedProfileIndex(null);
      return;
    }

    if (initialProfile) {
      setProfileName(initialProfile.name);
      setLocalNodes(toEditableNodesFromDomainProfile(initialProfile));
      return;
    }

    setProfileName("");
    setLocalNodes([]);
  }, [open, initialProfile]);

  const saveProfile = () => {
    // group nodes by category into the CategoryEntry format
    const domainBlocks = localNodes.reduce((acc, node) => {
      const cat = node.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = {
          description: "",
          content: []
        };
      }
      const type = EditableNode; //TODO: different types for different categories?
      const nodeData = {
        label: node.label,
        description: node.description,
        icon: node.icon,
        type: type,
        category: node.category,
        outputType: node.outputType,
        properties: node.properties,
        constraints: node.constraints,
        mapping: node.mapping,
        completionGuaranteed: true,
        compactOptions: [true, false],
        isDataType: node.category.includes("data"),
      };

      (acc[cat].content as any[]).push(nodeData);

      return acc;
    }, {} as Record<string, CategoryEntry>);

    const newProfile: DomainProfile = {
      name: profileName || "Untitled Profile",
      domainBlocks: domainBlocks,
    };

    onSave(newProfile);
    onClose();
  };

  const updateNode = (
    index: number,
    field: keyof EditableNodeProfile,
    value: any
  ) => {
    setLocalNodes((prev) => {
      const copy: any = structuredClone(prev);
      copy[index] = { ...copy[index], [field]: value };
      console.log("changed Node", copy[index])
      return copy;
    });
  };

  const addNode = () => {
    const newNode: EditableNodeProfile = {
      label: "",
      description: "",
      icon: "QAOA.png", //TODO: default Icon definieren
      visible: true,
      outputType: "",
      category: "",
      properties: [],
      constraints: [],
      mapping: [[]],
      originalLabel: "",
      originalDescription: "",
      originalIcon: "",
    };
    setLocalNodes([...localNodes, newNode]);
  };

  const handleIconUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      updateNode(index, "icon", reader.result);
    reader.readAsDataURL(file);
  };

  const categoryOptions = [dataTypes, boundaryNodes, operator, controlStructureNodes, customOperators, circuitLevelNodes, templates];

  const handleDropProfile = (targetIndex: number) => {
    if (draggedProfileIndex === null || draggedProfileIndex === targetIndex) {
      setDraggedProfileIndex(null);
      return;
    }

    onReorderProfiles(draggedProfileIndex, targetIndex);
    setDraggedProfileIndex(null);
  };

  const exportProfile = (profile: DomainProfile) => {
    const nodes = toEditableNodesFromDomainProfile(profile);
    const dataStr = JSON.stringify({ name: profile.name, nodes }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name || "domain_profile"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      title="Domain Profile"
      open={open}
      onClose={onClose}
      className="max-w-6xl"
      footer={
        <div className="space-x-2">
          <button
            className="btn btn-primary"
            onClick={saveProfile}
          >
            Save Profile
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="overflow-y-auto max-h-[70vh] space-y-8">
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Saved Profiles</h3>
              <p className="text-xs text-gray-500">Edit, duplicate, export, delete or reorder the stored profiles.</p>
            </div>
            <span className="text-xs text-gray-500">{profiles.length} total</span>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-500">
              Save a profile to see it here.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {profiles.map((profile, index) => (
                <div
                  key={`${profile.name}-${index}`}
                  draggable
                  onDragStart={() => setDraggedProfileIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropProfile(index)}
                  onDragEnd={() => setDraggedProfileIndex(null)}
                  className={`flex items-center gap-3 rounded border bg-white px-3 py-2 shadow-sm transition ${editingProfileIndex === index ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}
                >
                  <span className="cursor-grab text-gray-400" title="Drag to reorder">
                    <GripVertical size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{profile.name}</div>
                    <div className="text-xs text-gray-500">{Object.keys(profile.domainBlocks ?? {}).length} categories</div>
                  </div>
                  <button
                    type="button"
                    className="rounded border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    onClick={() => onEditProfile(index)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => onDuplicateProfile(index)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="rounded border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    onClick={() => exportProfile(profile)}
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteProfile(index)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-start items-center gap-2">
          <span className="px-4 py-2 font-semibold">Domain Profile Name</span>
          <input
            className="border rounded px-2 py-1"
            value={profileName}
            placeholder="Insert name..."
            onChange={(e) => setProfileName(e.target.value)}
          />

          <button
            onClick={addNode}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-shadow shadow-sm font-medium"
          >
            <Plus size={18} /> Add Domain Block
          </button>

          {/* Export Button */}
          <button
            onClick={() => {
              const dataStr = JSON.stringify({ name: profileName, nodes: localNodes }, null, 2);
              const blob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${profileName || "domain_profile"}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
          >
            Export Profile
          </button>

          {/* Load a revision from the shared repository. Renders nothing when
              VITE_DOMAIN_PROFILES_URL is unset. */}
          <DomainProfileRepositoryPicker
            onLoad={(profile) => {
              setProfileName(
                profile.version ? `${profile.name} v${profile.version}` : profile.name
              );
              setLocalNodes(toEditableNodes(profile));
            }}
          />

          {/* Import Button */}
          <label className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm cursor-pointer">
            Import Profile
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const json = JSON.parse(reader.result as string);
                    if (!json.name || !Array.isArray(json.nodes)) {
                      alert("Invalid domain profile JSON.");
                      return;
                    }

                    // Map imported nodes to ensure defaults
                    const sanitizedNodes: EditableNodeProfile[] = json.nodes.map((n: any) => ({
                      label: n.label || "",
                      description: n.description || "",
                      icon: n.icon || "QAOA.png",
                      visible: n.visible ?? true,
                      outputType: n.outputType || "",
                      category: n.category || "",
                      properties: n.properties || [],
                      constraints: n.constraints || [],
                      mapping: n.mapping || [[]],

                      originalLabel: n.originalLabel || n.label || "",
                      originalDescription: n.originalDescription || n.description || "",
                      originalIcon: n.originalIcon || n.icon || "",
                    }));

                    setProfileName(json.name);
                    setLocalNodes(sanitizedNodes);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to parse JSON file.");
                  }
                };
                reader.readAsText(file);
              }}
            />

          </label>
        </div>


        <div className="max-h-[70vh] overflow-y-auto space-y-8">
          <div className="overflow-x-auto">
            <table className="table-auto w-full border border-gray-300 rounded-md">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="p-2 border w-32">Name</th>
                  <th className="p-2 border w-24">Icon</th>
                  <th className="p-2 border w-24">Category</th>
                  <th className="p-2 border w-24">Output Type</th>
                  <th className="p-2 border w-32">Properties</th>
                  <th className="p-2 border w-32">Constraints</th>
                  <th className="p-2 border w-24">Mapping</th>
                  {/* <th className="p-2 border">Description</th>
                    <th className="p-2 border w-20 text-center">
                      Visible
                    </th>
                    <th className="p-2 border w-24">Actions</th> */}
                </tr>
              </thead>

              <tbody>
                {localNodes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                      No blocks added yet. Click "Add Domain Block" to begin.
                    </td>
                  </tr>
                ) : (
                  localNodes.map((node, idx) => (
                    <tr
                      key={`${node.originalLabel}-${idx}`}
                      className="align-top"
                    >
                      {/* Name */}
                      <td className="p-2 border">
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={node.label}
                          onChange={(e) =>
                            updateNode(idx, "label", e.target.value)
                          }
                        />
                      </td>
                      {/* Icon */}
                      <td className="relative group w-24 h-24 bg-white border rounded shrink-0 overflow-hidden p-2 border text-center">
                        <img
                          src={Array.isArray(node.icon)
                            ? node.icon[0]
                            : node.icon}
                          className="w-full h-full object-contain p-1"
                          alt="icon"
                        />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleIconUpload(e, idx)} />
                          <ImageIcon className="w-5 h-5 text-white" />
                        </label>
                      </td>
                      {/* Category (in palette panel)*/}
                      <td className="p-2 border">
                        <label htmlFor="profile-select" className="text-sm font-medium whitespace-nowrap">
                        </label>
                        <select
                          id="profile-select"
                          value={node.category}
                          onChange={(e) =>
                            updateNode(idx, "category", e.target.value)
                          }
                          className="border rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>Choose a category...</option>
                          
                            <option key={"dataTypes"} value={"dataTypes"}>
                              Data Types
                            </option>
                            <option key={"operators"} value={"Operators"}>
                              Operators
                            </option>
                          
                        </select>
                      </td>
                      {/* Output Type: String */}
                      <td className="p-2 border text-center">
  <OutputTypeEditor
    outputTypes={Array.isArray(node.outputType) ? node.outputType : [node.outputType].filter(Boolean)}
    onChange={(newTypes) => updateNode(idx, "outputType", newTypes)}
  />
</td>


                      {/* Properties  */}
                      <td className="p-2 border text-center">
                        <PropertyEditor
                          properties={node.properties || []}
                          onChange={(newProperties) =>
                            updateNode(idx, "properties", newProperties)
                          }
                        />
                      </td>
                      {/* Constraints  */}
                      <td className="p-2 border text-center">
                        <ConstraintEditor
                          constraints={node.constraints || []}
                          availableProperties={node.properties || []}
                          onChange={(newConstraints) =>
                            updateNode(idx, "constraints", newConstraints)
                          }
                        />
                      </td>
                      {/* Mappings  */}
                      <td className="p-2 border text-center">
                        <MappingEditor
                          mappings={node.mapping}
                          onChange={(newMappings) =>
                            updateNode(idx, "mapping", newMappings)
                          }
                        />
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
