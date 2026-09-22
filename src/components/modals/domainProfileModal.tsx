import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import { categories, CategoryEntry } from "../panels/categories";
import {
  ImageIcon,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  GripVertical,
} from "lucide-react";
import { EditableNode } from "@/constants";
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
};

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
 * list.
 */
function toEditableNodes(
  profile: RepositoryDomainProfile,
): EditableNodeProfile[] {
  return Object.entries(profile.domainBlocks ?? {}).flatMap(
    ([category, blocks]) =>
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
      })),
  );
}

function toEditableNodesFromDomainProfile(
  profile: DomainProfile,
): EditableNodeProfile[] {
  return Object.entries(profile.domainBlocks ?? {}).flatMap(
    ([category, entry]: any) => {
      const content = entry?.content ?? [];

      return (Array.isArray(content) ? content : []).map(
        (node: any) => ({
          label: node.label ?? "",
          description: node.description ?? "",
          icon: node.icon ?? "QAOA.png",
          visible: node.visible ?? true,
          outputType: node.outputType ?? "",
          category: node.category ?? category ?? "",
          properties: node.properties ?? [],
          constraints: node.constraints ?? [],
          mapping: node.mapping ?? [[]],

          originalLabel:
            node.originalLabel ?? node.label ?? "",

          originalDescription:
            node.originalDescription ??
            node.description ??
            "",

          originalIcon:
            node.originalIcon ??
            node.icon ??
            "QAOA.png",
        }),
      );
    },
  );
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
    } else if (
      typeof value === "object" &&
      value !== null
    ) {
      Object.values(value).forEach(walk);
    }
  };

  walk(content);

  return labels;
}

function PropertyEditor({
  properties,
  onChange,
}: {
  properties: NodeProfileProperty[];
  onChange: (props: NodeProfileProperty[]) => void;
}) {
  const addProperty = () => {
    onChange([
      ...properties,
      {
        name: "",
        type: "",
      },
    ]);
  };

  const updateProperty = (
    index: number,
    field: keyof NodeProfileProperty,
    value: any,
  ) => {
    const newProps = [...properties];

    newProps[index] = {
      ...newProps[index],
      [field]: value,
    };

    onChange(newProps);
  };

  const removeProperty = (index: number) => {
    onChange(
      properties.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {properties.map((prop, idx) => (
        <div
          key={idx}
          className="p-2 border rounded bg-gray-50 relative group"
        >
          <button
            type="button"
            onClick={() => removeProperty(idx)}
            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
          >
            <Trash2 size={12} />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">
                Name
              </label>

              <input
                className="w-full border rounded px-1 py-0.5 text-xs"
                value={prop.name}
                onChange={(e) =>
                  updateProperty(
                    idx,
                    "name",
                    e.target.value,
                  )
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">
                Type
              </label>

              <input
                className="w-full border rounded px-1 py-0.5 text-xs"
                value={prop.type}
                onChange={(e) =>
                  updateProperty(
                    idx,
                    "type",
                    e.target.value,
                  )
                }
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addProperty}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors"
      >
        <Plus size={14} />
        Add Property
      </button>
    </div>
  );
}

function ConstraintEditor({
  constraints,
  availableProperties,
  onChange,
}: {
  constraints: NodeProfileConstraint[];
  availableProperties: NodeProfileProperty[];
  onChange: (
    props: NodeProfileConstraint[],
  ) => void;
}) {
  const constraintOptions = [
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "is required",
  ];

  const propertyOptions = (
    availableProperties || []
  ).flatMap((prop) => {
    const base = [prop.name];

    if (
      prop.type.toLowerCase().includes("array") ||
      prop.type.includes("[]")
    ) {
      base.push(`length(${prop.name})`);
    }

    return base;
  });

  const addConstraint = () => {
    onChange([
      ...constraints,
      {
        propertyName: "",
        constraint: "",
        value: "",
      },
    ]);
  };

  const updateConstraint = (
    index: number,
    field: keyof NodeProfileConstraint,
    value: any,
  ) => {
    const newConstraints = [...constraints];

    const finalValue =
      field === "constraint" &&
      value === "is required"
        ? ""
        : field === "value"
          ? value
          : newConstraints[index].value;

    newConstraints[index] = {
      ...newConstraints[index],
      [field]: value,
      value: finalValue,
    };

    onChange(newConstraints);
  };

  const removeConstraint = (index: number) => {
    onChange(
      constraints.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {constraints.map((con, idx) => {
        const isRequiredType =
          con.constraint === "is required";

        return (
          <div
            key={idx}
            className="p-2 border rounded bg-gray-50 relative group"
          >
            <button
              type="button"
              onClick={() => removeConstraint(idx)}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
            >
              <Trash2 size={12} />
            </button>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Property
                </label>

                <select
                  className="w-full border rounded px-1 py-0.5 text-xs bg-white"
                  value={con.propertyName}
                  onChange={(e) =>
                    updateConstraint(
                      idx,
                      "propertyName",
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Select...
                  </option>

                  {propertyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Constraint
                </label>

                <select
                  className="w-full border rounded px-1 py-0.5 text-xs bg-white"
                  value={con.constraint}
                  onChange={(e) =>
                    updateConstraint(
                      idx,
                      "constraint",
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Select...
                  </option>

                  {constraintOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Value
                </label>

                <input
                  className={`w-full border rounded px-1 py-0.5 text-xs ${
                    isRequiredType
                      ? "bg-gray-200 cursor-not-allowed text-transparent"
                      : "bg-white"
                  }`}
                  value={con.value}
                  disabled={isRequiredType}
                  placeholder={
                    isRequiredType
                      ? "-"
                      : "Value..."
                  }
                  onChange={(e) =>
                    updateConstraint(
                      idx,
                      "value",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addConstraint}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors"
      >
        <Plus size={14} />
        Add Constraint
      </button>
    </div>
  );
}

const staticMappingOptions = {
  Number: "Number",
  Array: "Array",
  QUBO: "QUBO",
  QAOA: "QAOA",
  VQE: "VQE",
  QAE: "QAE",
};

const dynamicMappingOptions =
  extractNodeLabels(categories);

const mappingOptions: Record<string, string> = {
  ...staticMappingOptions,
  ...dynamicMappingOptions,
};

function OutputTypeEditor({
  outputTypes,
  onChange,
}: {
  outputTypes: string[];
  onChange: (types: string[]) => void;
}) {
  const addType = () => {
    onChange([...outputTypes, ""]);
  };

  const updateType = (
    index: number,
    value: string,
  ) => {
    const newTypes = [...outputTypes];

    newTypes[index] = value;

    onChange(newTypes);
  };

  const removeType = (index: number) => {
    onChange(
      outputTypes.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-2 min-w-[150px]">
      {outputTypes.map((type, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1 p-1 border rounded bg-gray-50 relative group"
        >
          <input
            className="flex-1 border rounded px-1 py-0.5 text-xs"
            value={type}
            onChange={(e) =>
              updateType(idx, e.target.value)
            }
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
        <Plus size={14} />
        Add Output Type
      </button>
    </div>
  );
}

function MappingGroup({
  selected,
  onToggle,
  onRemove,
}: {
  selected: string[];
  onToggle: (val: string) => void;
  onRemove: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] =
    useState("");

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const filteredOptions =
    Object.entries(mappingOptions).filter(
      ([option, desc]) => {
        const search =
          searchTerm.trim().toLowerCase();

        if (!search) return true;

        return (
          option
            .toLowerCase()
            .includes(search) ||
          desc
            .toLowerCase()
            .includes(search)
        );
      },
    );

  return (
    <div
      className="relative mb-2 flex items-center gap-2 group"
      ref={dropdownRef}
    >
      <div className="flex-1">
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);

            if (isOpen) {
              setSearchTerm("");
            }
          }}
          className="w-full flex items-center justify-between bg-white border rounded px-2 py-1.5 text-xs hover:border-blue-400 transition-colors"
        >
          <span className="truncate">
            {selected.length > 0
              ? selected.join(" + ")
              : "Select mapping..."}
          </span>

          <ChevronDown
            size={14}
            className={`flex-shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-[100] mt-1 w-full bg-white border rounded-md shadow-lg overflow-hidden">
            <div className="p-2 border-b bg-gray-50">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                    setSearchTerm("");
                  }
                }}
                placeholder="Type to search..."
                className="w-full border rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-gray-400 text-center">
                  No matching mappings
                </div>
              ) : (
                filteredOptions.map(
                  ([option, desc]) => {
                    const isChecked =
                      selected.includes(
                        option,
                      );

                    return (
                      <div
                        key={option}
                        title={desc}
                        onClick={() =>
                          onToggle(option)
                        }
                        className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs"
                      >
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                            isChecked
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white"
                          }`}
                        >
                          {isChecked && (
                            <Check
                              size={10}
                              className="text-white"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div
                            className={
                              isChecked
                                ? "font-bold text-blue-700 truncate"
                                : "text-gray-700 truncate"
                            }
                          >
                            {option}
                          </div>

                          {desc &&
                            desc !==
                              option && (
                              <div className="text-[10px] text-gray-400 truncate">
                                {desc}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  },
                )
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export function MappingEditor({
  mappings,
  onChange,
}: {
  mappings: string[][];
  onChange: (
    newMappings: string[][],
  ) => void;
}) {
  const handleToggle = (
    groupIdx: number,
    val: string,
  ) => {
    const newMappings = [...mappings];
    const currentGroup =
      newMappings[groupIdx] || [];

    if (currentGroup.includes(val)) {
      newMappings[groupIdx] =
        currentGroup.filter(
          (v) => v !== val,
        );
    } else {
      newMappings[groupIdx] = [
        ...currentGroup,
        val,
      ].sort();
    }

    onChange(newMappings);
  };

  const addGroup = () =>
    onChange([...mappings, []]);

  const removeGroup = (idx: number) =>
    onChange(
      mappings.filter((_, i) => i !== idx),
    );

  return (
    <div className="min-w-[200px] p-1">
      {mappings.map((group, idx) => (
        <MappingGroup
          key={idx}
          selected={group}
          onToggle={(val) =>
            handleToggle(idx, val)
          }
          onRemove={() =>
            removeGroup(idx)
          }
        />
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-200 rounded text-gray-400 hover:border-blue-300 hover:text-blue-500 text-[10px] transition-all"
      >
        <Plus size={12} />
        Add Mapping
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
  onReorderProfiles: (
    fromIndex: number,
    toIndex: number,
  ) => void;
  onDuplicateProfile: (
    index: number,
  ) => void;
}) {
  const [localNodes, setLocalNodes] =
    useState<EditableNodeProfile[]>([]);

  const [profileName, setProfileName] =
    useState("");

  const [
    draggedProfileIndex,
    setDraggedProfileIndex,
  ] = useState<number | null>(null);

  const [
    duplicateWarning,
    setDuplicateWarning,
  ] = useState<{
    originalName: string;
    versionedName: string;
  } | null>(null);

  const [
    activeTab,
    setActiveTab,
  ] = useState<"saved" | "create">(
    "create",
  );

  useEffect(() => {
    if (!open) {
      setLocalNodes([]);
      setProfileName("");
      setDraggedProfileIndex(null);
      setDuplicateWarning(null);
      setActiveTab("create");
      return;
    }

    if (initialProfile) {
      setProfileName(initialProfile.name);
      setLocalNodes(
        toEditableNodesFromDomainProfile(
          initialProfile,
        ),
      );
      setDuplicateWarning(null);
      setActiveTab("create");
      return;
    }

    setProfileName("");
    setLocalNodes([]);
    setDuplicateWarning(null);
    setActiveTab("create");
  }, [open, initialProfile]);

  const getVersionedProfileName = (
    name: string,
  ): string => {
    const normalizedNames = profiles.map(
      (profile) =>
        profile.name.trim().toLowerCase(),
    );

    let version = 2;
    let candidate = `${name} v${version}`;

    while (
      normalizedNames.includes(
        candidate.toLowerCase(),
      )
    ) {
      version++;
      candidate = `${name} v${version}`;
    }

    return candidate;
  };

  const saveProfileWithName = (
    finalName: string,
  ) => {
    const domainBlocks =
      localNodes.reduce(
        (acc, node) => {
          const cat =
            node.category ||
            "Uncategorized";

          if (!acc[cat]) {
            acc[cat] = {
              description: "",
              content: [],
            };
          }

          const type = EditableNode;

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
            isDataType:
              node.category.includes(
                "data",
              ),
          };

          (
            acc[cat].content as any[]
          ).push(nodeData);

          return acc;
        },
        {} as Record<
          string,
          CategoryEntry
        >,
      );

    const newProfile: DomainProfile = {
      name: finalName,
      domainBlocks,
    };

    onSave(newProfile);
    onClose();
  };

  const saveProfile = () => {
    const requestedName =
      profileName.trim() ||
      "Untitled Profile";

    const existingProfile =
      profiles.find(
        (profile, index) =>
          index !== editingProfileIndex &&
          profile.name
            .trim()
            .toLowerCase() ===
            requestedName.toLowerCase(),
      );

    if (existingProfile) {
      const versionedName =
        getVersionedProfileName(
          requestedName,
        );

      setDuplicateWarning({
        originalName: requestedName,
        versionedName,
      });

      return;
    }

    saveProfileWithName(
      requestedName,
    );
  };

  const updateNode = (
    index: number,
    field: keyof EditableNodeProfile,
    value: any,
  ) => {
    setLocalNodes((prev) => {
      const copy: any =
        structuredClone(prev);

      copy[index] = {
        ...copy[index],
        [field]: value,
      };

      return copy;
    });
  };

  const addNode = () => {
    const newNode: EditableNodeProfile = {
      label: "",
      description: "",
      icon: "QAOA.png",
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

    setLocalNodes([
      ...localNodes,
      newNode,
    ]);
  };

  const handleIconUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () =>
      updateNode(
        index,
        "icon",
        reader.result,
      );

    reader.readAsDataURL(file);
  };

  const handleDropProfile = (
    targetIndex: number,
  ) => {
    if (
      draggedProfileIndex === null ||
      draggedProfileIndex ===
        targetIndex
    ) {
      setDraggedProfileIndex(null);
      return;
    }

    onReorderProfiles(
      draggedProfileIndex,
      targetIndex,
    );

    setDraggedProfileIndex(null);
  };

  const exportProfile = (
    profile: DomainProfile,
  ) => {
    const nodes =
      toEditableNodesFromDomainProfile(
        profile,
      );

    const dataStr = JSON.stringify(
      {
        name: profile.name,
        nodes,
      },
      null,
      2,
    );

    const blob = new Blob(
      [dataStr],
      {
        type: "application/json",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = `${
      profile.name ||
      "domain_profile"
    }.json`;

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
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            {activeTab === "saved"
              ? `${profiles.length} saved profile${
                  profiles.length ===
                  1
                    ? ""
                    : "s"
                }`
              : profileName
                ? `Editing: ${profileName}`
                : "New domain profile"}
          </div>

          <div className="space-x-2">
            <button
              className={`btn ${
                duplicateWarning
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "btn-primary"
              }`}
              onClick={saveProfile}
              disabled={
                !!duplicateWarning ||
                activeTab !== "create"
              }
            >
              Save Profile
            </button>

            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col min-h-0">
        {/* Tabs */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center gap-1 px-1">
            <button
              type="button"
              onClick={() =>
                setActiveTab("saved")
              }
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "saved"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Saved Profiles

              {profiles.length > 0 && (
                <span
                  className={`ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                    activeTab ===
                    "saved"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {profiles.length}
                </span>
              )}

              {activeTab === "saved" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("create")
              }
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "create"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {editingProfileIndex !==
              null
                ? "Edit Profile"
                : "Create Profile"}

              {activeTab ===
                "create" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Single scroll area */}
        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2">
          {/* ===================================================== */}
          {/* SAVED PROFILES */}
          {/* ===================================================== */}
          {activeTab === "saved" && (
            <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Saved Profiles
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Edit, duplicate,
                    export, delete or
                    reorder your stored
                    domain profiles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileName("");
                    setLocalNodes([]);
                    setDuplicateWarning(
                      null,
                    );
                    setActiveTab(
                      "create",
                    );
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  Create Profile
                </button>
              </div>

              {profiles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                  <div className="text-sm font-medium text-gray-700">
                    No saved
                    profiles
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Create your
                    first domain
                    profile to see
                    it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map(
                    (
                      profile,
                      index,
                    ) => (
                      <div
                        key={`${profile.name}-${index}`}
                        draggable
                        onDragStart={() =>
                          setDraggedProfileIndex(
                            index,
                          )
                        }
                        onDragOver={(
                          event,
                        ) =>
                          event.preventDefault()
                        }
                        onDrop={() =>
                          handleDropProfile(
                            index,
                          )
                        }
                        onDragEnd={() =>
                          setDraggedProfileIndex(
                            null,
                          )
                        }
                        className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm transition ${
                          editingProfileIndex ===
                          index
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className="cursor-grab text-gray-400 hover:text-gray-600"
                          title="Drag to reorder"
                        >
                          <GripVertical
                            size={18}
                          />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {
                              profile.name
                            }
                          </div>

                          <div className="text-xs text-gray-500 mt-0.5">
                            {Object.keys(
                              profile.domainBlocks ??
                                {},
                            ).length}{" "}
                            categories
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              onEditProfile(
                                index,
                              );
                              setActiveTab(
                                "create",
                              );
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              onDuplicateProfile(
                                index,
                              );
                              setActiveTab(
                                "create",
                              );
                            }}
                          >
                            Duplicate
                          </button>

                          <button
                            type="button"
                            className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            onClick={() =>
                              exportProfile(
                                profile,
                              )
                            }
                          >
                            Export
                          </button>

                          <button
                            type="button"
                            className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            onClick={() =>
                              onDeleteProfile(
                                index,
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          )}

          {/* ===================================================== */}
          {/* CREATE / EDIT PROFILE */}
          {/* ===================================================== */}
          {activeTab === "create" && (
            <div className="space-y-5">
              {/* Profile Header */}
              <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      Domain Profile Name
                    </span>

                    <input
                      className="border rounded-md px-3 py-2 text-sm bg-white min-w-[240px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={
                        profileName
                      }
                      placeholder="Insert name..."
                      onChange={(e) => {
                        setProfileName(
                          e.target.value,
                        );

                        if (
                          duplicateWarning
                        ) {
                          setDuplicateWarning(
                            null,
                          );
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addNode}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-shadow shadow-sm font-medium text-sm"
                  >
                    <Plus size={18} />
                    Add Domain
                    Block
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const dataStr =
                        JSON.stringify(
                          {
                            name: profileName,
                            nodes: localNodes,
                          },
                          null,
                          2,
                        );

                      const blob =
                        new Blob(
                          [dataStr],
                          {
                            type: "application/json",
                          },
                        );

                      const url =
                        URL.createObjectURL(
                          blob,
                        );

                      const a =
                        document.createElement(
                          "a",
                        );

                      a.href = url;
                      a.download = `${
                        profileName ||
                        "domain_profile"
                      }.json`;

                      a.click();

                      URL.revokeObjectURL(
                        url,
                      );
                    }}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Export Profile
                  </button>

                  <DomainProfileRepositoryPicker
                    onLoad={(
                      profile,
                    ) => {
                      setProfileName(
                        profile.version
                          ? `${profile.name} v${profile.version}`
                          : profile.name,
                      );

                      setLocalNodes(
                        toEditableNodes(
                          profile,
                        ),
                      );

                      setDuplicateWarning(
                        null,
                      );
                    }}
                  />

                  <label className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm cursor-pointer">
                    Import Profile

                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(
                        e,
                      ) => {
                        const file =
                          e.target
                            .files?.[0];

                        if (!file)
                          return;

                        const reader =
                          new FileReader();

                        reader.onload =
                          () => {
                            try {
                              const json =
                                JSON.parse(
                                  reader.result as string,
                                );

                              if (
                                !json.name ||
                                !Array.isArray(
                                  json.nodes,
                                )
                              ) {
                                alert(
                                  "Invalid domain profile JSON.",
                                );
                                return;
                              }

                              const sanitizedNodes: EditableNodeProfile[] =
                                json.nodes.map(
                                  (
                                    n: any,
                                  ) => ({
                                    label:
                                      n.label ||
                                      "",
                                    description:
                                      n.description ||
                                      "",
                                    icon:
                                      n.icon ||
                                      "QAOA.png",
                                    visible:
                                      n.visible ??
                                      true,
                                    outputType:
                                      n.outputType ||
                                      "",
                                    category:
                                      n.category ||
                                      "",
                                    properties:
                                      n.properties ||
                                      [],
                                    constraints:
                                      n.constraints ||
                                      [],
                                    mapping:
                                      n.mapping ||
                                      [[]],

                                    originalLabel:
                                      n.originalLabel ||
                                      n.label ||
                                      "",

                                    originalDescription:
                                      n.originalDescription ||
                                      n.description ||
                                      "",

                                    originalIcon:
                                      n.originalIcon ||
                                      n.icon ||
                                      "",
                                  }),
                                );

                              setProfileName(
                                json.name,
                              );

                              setLocalNodes(
                                sanitizedNodes,
                              );

                              setDuplicateWarning(
                                null,
                              );
                            } catch (err) {
                              console.error(
                                err,
                              );

                              alert(
                                "Failed to parse JSON file.",
                              );
                            }
                          };

                        reader.readAsText(
                          file,
                        );

                        e.target.value =
                          "";
                      }}
                    />
                  </label>
                </div>
              </section>

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-900">
                        Profile name
                        already exists
                      </h3>

                      <p className="mt-1 text-sm text-yellow-800">
                        A profile
                        named{" "}
                        <strong>
                          "
                          {
                            duplicateWarning.originalName
                          }
                          "
                        </strong>{" "}
                        already
                        exists.
                      </p>

                      <p className="mt-1 text-sm text-yellow-800">
                        Would you like
                        to save this
                        profile as{" "}
                        <strong>
                          "
                          {
                            duplicateWarning.versionedName
                          }
                          "
                        </strong>
                        ?
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            saveProfileWithName(
                              duplicateWarning.versionedName,
                            );

                            setDuplicateWarning(
                              null,
                            );
                          }}
                        >
                          Save as{" "}
                          {
                            duplicateWarning.versionedName
                          }
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            setDuplicateWarning(
                              null,
                            )
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain Blocks */}
              <section className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b bg-gray-50 px-4 py-3">
                  <div className="text-sm font-semibold text-gray-800">
                    Domain Blocks
                  </div>

                  <div className="text-xs text-gray-500 mt-0.5">
                    Configure the nodes,
                    properties,
                    constraints,
                    output types and
                    mappings.
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-auto w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                      <tr>
                        <th className="p-2 border w-32">
                          Name
                        </th>

                        <th className="p-2 border w-24">
                          Icon
                        </th>

                        <th className="p-2 border w-24">
                          Category
                        </th>

                        <th className="p-2 border w-24">
                          Output Type
                        </th>

                        <th className="p-2 border w-32">
                          Properties
                        </th>

                        <th className="p-2 border w-32">
                          Constraints
                        </th>

                        <th className="p-2 border w-24">
                          Mapping
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {localNodes.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-gray-400 italic"
                          >
                            No blocks
                            added yet.
                            Click
                            "Add Domain
                            Block" to
                            begin.
                          </td>
                        </tr>
                      ) : (
                        localNodes.map(
                          (
                            node,
                            idx,
                          ) => (
                            <tr
                              key={`${node.originalLabel}-${idx}`}
                              className="align-top"
                            >
                              {/* Name */}
                              <td className="p-2 border">
                                <input
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  value={
                                    node.label
                                  }
                                  onChange={(
                                    e,
                                  ) =>
                                    updateNode(
                                      idx,
                                      "label",
                                      e
                                        .target
                                        .value,
                                    )
                                  }
                                />
                              </td>

                              {/* Icon */}
                              <td className="relative group w-24 h-24 bg-white border rounded shrink-0 overflow-hidden p-2 text-center">
                                <img
                                  src={
                                    Array.isArray(
                                      node.icon,
                                    )
                                      ? node
                                          .icon[0]
                                      : node.icon
                                  }
                                  className="w-full h-full object-contain p-1"
                                  alt="icon"
                                />

                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(
                                      e,
                                    ) =>
                                      handleIconUpload(
                                        e,
                                        idx,
                                      )
                                    }
                                  />

                                  <ImageIcon className="w-5 h-5 text-white" />
                                </label>
                              </td>

                              {/* Category */}
                              <td className="p-2 border">
                                <select
                                  value={
                                    node.category
                                  }
                                  onChange={(
                                    e,
                                  ) =>
                                    updateNode(
                                      idx,
                                      "category",
                                      e
                                        .target
                                        .value,
                                    )
                                  }
                                  className="border rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option
                                    value=""
                                    disabled
                                  >
                                    Choose a
                                    category...
                                  </option>

                                  <option value="dataTypes">
                                    Data
                                    Types
                                  </option>

                                  <option value="Operators">
                                    Operators
                                  </option>
                                </select>
                              </td>

                              {/* Output Type */}
                              <td className="p-2 border text-center">
                                <OutputTypeEditor
                                  outputTypes={
                                    Array.isArray(
                                      node.outputType,
                                    )
                                      ? node.outputType
                                      : [
                                          node.outputType,
                                        ].filter(
                                          Boolean,
                                        )
                                  }
                                  onChange={(
                                    newTypes,
                                  ) =>
                                    updateNode(
                                      idx,
                                      "outputType",
                                      newTypes,
                                    )
                                  }
                                />
                              </td>

                              {/* Properties */}
                              <td className="p-2 border text-center">
                                <PropertyEditor
                                  properties={
                                    node.properties ||
                                    []
                                  }
                                  onChange={(
                                    newProperties,
                                  ) =>
                                    updateNode(
                                      idx,
                                      "properties",
                                      newProperties,
                                    )
                                  }
                                />
                              </td>

                              {/* Constraints */}
                              <td className="p-2 border text-center">
                                <ConstraintEditor
                                  constraints={
                                    node.constraints ||
                                    []
                                  }
                                  availableProperties={
                                    node.properties ||
                                    []
                                  }
                                  onChange={(
                                    newConstraints,
                                  ) =>
                                    updateNode(
                                      idx,
                                      "constraints",
                                      newConstraints,
                                    )
                                  }
                                />
                              </td>

                              {/* Mapping */}
                              <td className="p-2 border text-center">
                                <MappingEditor
                                  mappings={
                                    node.mapping
                                  }
                                  onChange={(
                                    newMappings,
                                  ) =>
                                    updateNode(
                                      idx,
                                      "mapping",
                                      newMappings,
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
                    }
