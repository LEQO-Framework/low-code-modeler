import { useState, useRef, useEffect, useId } from "react";
import Modal from "./Modal";
import { categories, CategoryEntry } from "../panels/categories";
import {
  ImageIcon,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  GripVertical,
  X,
} from "lucide-react";
import { EditableNode } from "@/constants";
import {
  domainBlockHeaderIcon,
  uploadedHeaderIcon,
} from "@/lib/domainBlockIcon";
import { DomainProfileRepositoryPicker } from "./domainProfileRepositoryPicker";
import { RepositoryDomainProfile } from "../../services/domainProfileRepository";
import { createPortal } from "react-dom";

export const DATA_TYPES_CATEGORY = "dataTypes";
export const QUANTUM_OPERATORS_CATEGORY = "Quantum Operators";
export const CLASSICAL_OPERATORS_CATEGORY = "Classical Operators";
// profiles created before the quantum/classical split used this category
const LEGACY_OPERATORS_CATEGORY = "Operators";

export type PortKind = "quantum" | "classical";

export interface NodeProfilePort {
  name: string;
  type: string;
  kind: PortKind;
  optional: boolean;
}

export interface EditableNodeProfile {
  label: string;
  description: string;
  icon: string | string[];
  visible: boolean;
  category: string;
  inputs: NodeProfilePort[];
  outputs: NodeProfilePort[];
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
  required?: boolean;
}

interface NodeProfileConstraint {
  propertyName: string;
  constraint: string;
  value?: string;
}

const isOperatorCategory = (category: string) =>
  category === QUANTUM_OPERATORS_CATEGORY ||
  category === CLASSICAL_OPERATORS_CATEGORY;

const defaultPortKind = (category: string): PortKind =>
  category === QUANTUM_OPERATORS_CATEGORY ? "quantum" : "classical";

/**
 * Names that are used by more than one of the block's inputs and outputs.
 * Inputs and outputs share one namespace.
 */
function findDuplicatePortNames(node: EditableNodeProfile): Set<string> {
  const ports = [
    ...(isOperatorCategory(node.category) ? node.inputs : []),
    ...node.outputs,
  ];
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ports.forEach((port) => {
    const name = port.name.trim();

    if (!name) return;

    if (seen.has(name)) duplicates.add(name);

    seen.add(name);
  });

  return duplicates;
}

// palette icons, the same ones the built-in custom nodes use
const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  [DATA_TYPES_CATEGORY]: "PaletteIcon_CustomDataType.svg",
  [QUANTUM_OPERATORS_CATEGORY]: "PaletteIcon_CustomQuantumOperator.png",
  [CLASSICAL_OPERATORS_CATEGORY]: "PaletteIcon_CustomClassicalOperator.png",
};

const PLACEHOLDER_ICON = "QAOA.png";

/** True if the icon was not chosen by the user (no upload). */
const isDefaultIcon = (icon: string | string[] | undefined) =>
  !icon ||
  icon === PLACEHOLDER_ICON ||
  Object.values(DEFAULT_CATEGORY_ICONS).includes(icon as string);

const defaultIcon = (category: string) =>
  DEFAULT_CATEGORY_ICONS[category] ?? PLACEHOLDER_ICON;

function normalizeCategory(category: string): string {
  return category === LEGACY_OPERATORS_CATEGORY
    ? CLASSICAL_OPERATORS_CATEGORY
    : category;
}

function normalizePorts(
  ports: any[] | undefined,
  category: string,
): NodeProfilePort[] {
  return (ports ?? []).map((port: any) => ({
    name: port?.name ?? "",
    type: port?.type ?? "",
    kind:
      category === CLASSICAL_OPERATORS_CATEGORY
        ? "classical"
        : (port?.kind ?? defaultPortKind(category)),
    optional: !!port?.optional,
  }));
}

/**
 * Convert a stored block (domain profile entry, repository block or imported
 * JSON node) into the editor's representation.
 */
function toEditableNode(raw: any, fallbackCategory = ""): EditableNodeProfile {
  const category = normalizeCategory(raw?.category || fallbackCategory || "");

  // older profiles only stored a list of output type names
  const legacyOutputs = (
    Array.isArray(raw?.outputType) ? raw.outputType : [raw?.outputType]
  )
    .filter(Boolean)
    .map((type: string) => ({ name: "", type, optional: false }));

  return {
    label: raw?.label ?? "",
    description: raw?.description ?? "",
    icon: isDefaultIcon(raw?.icon) ? defaultIcon(category) : raw.icon,
    visible: raw?.visible ?? true,
    category,
    inputs: normalizePorts(raw?.inputPorts ?? raw?.inputs, category),
    outputs: normalizePorts(
      raw?.outputPorts ?? raw?.outputs ?? legacyOutputs,
      category,
    ),
    properties: raw?.properties ?? [],
    constraints: raw?.constraints ?? [],
    mapping: raw?.mapping ?? [[]],

    originalLabel: raw?.originalLabel || raw?.label || "",
    originalDescription: raw?.originalDescription || raw?.description || "",
    originalIcon: raw?.originalIcon || raw?.icon || "QAOA.png",
  };
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
      (blocks ?? []).map((block) =>
        toEditableNode({ ...block, category }, category),
      ),
  );
}

function toEditableNodesFromDomainProfile(
  profile: DomainProfile,
): EditableNodeProfile[] {
  return Object.entries(profile.domainBlocks ?? {}).flatMap(
    ([category, entry]: any) => {
      const content = entry?.content ?? [];

      return (Array.isArray(content) ? content : []).map((node: any) =>
        toEditableNode(node, category),
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
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  };

  walk(content);

  return labels;
}

/** Types a property value can have. */
export const PROPERTY_TYPES = [
  "int",
  "String",
  "number",
  "boolean",
  "bit",
  "Array",
  "File",
];

const QUANTUM_REGISTER_TYPE = "quantum register";

/**
 * Types defined in the profile, for the inputs and outputs of its blocks: the output
 * types of the data types first, then those of the operators (without duplicates).
 */
function profileTypes(nodes: EditableNodeProfile[]): string[] {
  const dataTypesFirst = [
    ...nodes.filter((n) => n.category === DATA_TYPES_CATEGORY),
    ...nodes.filter((n) => n.category !== DATA_TYPES_CATEGORY),
  ];
  const types = dataTypesFirst.flatMap((n) =>
    n.outputs.map((port) => port.type.trim()),
  );
  return [...new Set(types)].filter(
    (type) => type && type !== QUANTUM_REGISTER_TYPE,
  );
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
        required: true,
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
    onChange(properties.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {properties.map((prop, idx) => (
        <div
          key={idx}
          className={`p-2 border rounded relative group ${
            prop.required
              ? "bg-gray-50"
              : "border-dashed border-gray-400 bg-white"
          }`}
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
                onChange={(e) => updateProperty(idx, "name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">
                Type
              </label>

              <select
                className="w-full border rounded px-1 py-0.5 text-xs bg-white"
                value={prop.type}
                onChange={(e) => updateProperty(idx, "type", e.target.value)}
              >
                <option value="" disabled>
                  Select...
                </option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                {/* a type of an older profile stays selectable */}
                {prop.type && !PROPERTY_TYPES.includes(prop.type) && (
                  <option value={prop.type}>{prop.type} (not in list)</option>
                )}
              </select>
            </div>
          </div>

          <label className="mt-2 flex items-center justify-end gap-1 text-[10px] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={!!prop.required}
              onChange={(e) =>
                updateProperty(idx, "required", e.target.checked)
              }
            />
            Required
          </label>
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
  onChange: (props: NodeProfileConstraint[]) => void;
}) {
  const constraintOptions = ["==", "!=", "<", ">", "<=", ">="];

  const propertyOptions = (availableProperties || []).flatMap((prop) => {
    const base = [prop.name];

    if (prop.type.toLowerCase().includes("array") || prop.type.includes("[]")) {
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

    newConstraints[index] = {
      ...newConstraints[index],
      [field]: value,
    };

    onChange(newConstraints);
  };

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {constraints.map((con, idx) => {
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
                    updateConstraint(idx, "propertyName", e.target.value)
                  }
                >
                  <option value="">Select...</option>

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
                    updateConstraint(idx, "constraint", e.target.value)
                  }
                >
                  <option value="">Select...</option>

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
                  className="w-full border rounded px-1 py-0.5 text-xs bg-white"
                  value={con.value}
                  placeholder="Value..."
                  onChange={(e) =>
                    updateConstraint(idx, "value", e.target.value)
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

const dynamicMappingOptions = extractNodeLabels(categories);

const mappingOptions: Record<string, string> = {
  ...staticMappingOptions,
  ...dynamicMappingOptions,
};

function PortEditor({
  ports,
  category,
  addLabel,
  duplicateNames,
  definedTypes,
  checkDefined = false,
  onChange,
}: {
  ports: NodeProfilePort[];
  category: string;
  addLabel: string;
  duplicateNames: Set<string>;
  /** Types defined in the profile (output types of its blocks), offered as types. */
  definedTypes: string[];
  /** Hint at a classical type that no block of the profile outputs (for inputs). */
  checkDefined?: boolean;
  onChange: (ports: NodeProfilePort[]) => void;
}) {
  // only quantum operators can mix quantum and classical ports
  const kindSelectable = category === QUANTUM_OPERATORS_CATEGORY;
  const listId = useId();
  const suggestions = (kind: PortKind) =>
    kind === "quantum"
      ? [QUANTUM_REGISTER_TYPE]
      : [
          ...definedTypes,
          ...PROPERTY_TYPES.filter((t) => !definedTypes.includes(t)),
        ];
  const isUndefinedType = (port: NodeProfilePort) => {
    const type = port.type.trim();
    return (
      checkDefined &&
      port.kind === "classical" &&
      type !== "" &&
      !definedTypes.includes(type) &&
      !PROPERTY_TYPES.some((t) => t.toLowerCase() === type.toLowerCase())
    );
  };

  const addPort = () => {
    const kind = defaultPortKind(category);

    onChange([
      ...ports,
      {
        name: "",
        type: kind === "quantum" ? "quantum register" : "",
        kind,
        optional: false,
      },
    ]);
  };

  const updatePort = (
    index: number,
    field: keyof NodeProfilePort,
    value: any,
  ) => {
    const newPorts = [...ports];

    newPorts[index] = {
      ...newPorts[index],
      [field]: value,
    };

    onChange(newPorts);
  };

  const removePort = (index: number) => {
    onChange(ports.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 min-w-[200px]">
      {ports.map((port, idx) => (
        <div
          key={idx}
          className={`p-2 border rounded relative group ${
            port.optional
              ? "border-dashed border-gray-400 bg-white"
              : "bg-gray-50"
          }`}
        >
          <button
            type="button"
            onClick={() => removePort(idx)}
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
                className={`w-full border rounded px-1 py-0.5 text-xs ${
                  duplicateNames.has(port.name.trim())
                    ? "border-red-500 bg-red-50"
                    : ""
                }`}
                value={port.name}
                onChange={(e) => updatePort(idx, "name", e.target.value)}
              />

              {duplicateNames.has(port.name.trim()) && (
                <span className="block text-[10px] text-red-600 mt-0.5">
                  Name must be unique
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">
                Type
              </label>

              {/* a type of the profile, or a new one */}
              <input
                className={`w-full border rounded px-1 py-0.5 text-xs ${
                  isUndefinedType(port) ? "border-amber-500 bg-amber-50" : ""
                }`}
                list={`${listId}-${port.kind}`}
                placeholder="Select or type..."
                value={port.type}
                onChange={(e) => updatePort(idx, "type", e.target.value)}
              />

              {isUndefinedType(port) && (
                <span className="block text-[10px] text-amber-700 mt-0.5">
                  No block of this profile outputs this type
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            {kindSelectable ? (
              <select
                className="border rounded px-1 py-0.5 text-xs bg-white"
                value={port.kind}
                onChange={(e) => updatePort(idx, "kind", e.target.value)}
              >
                <option value="quantum">Quantum</option>
                <option value="classical">Classical</option>
              </select>
            ) : (
              <span className="text-[10px] text-gray-500 uppercase">
                Classical
              </span>
            )}

            <label className="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={port.optional}
                onChange={(e) => updatePort(idx, "optional", e.target.checked)}
              />
              Optional
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPort}
        className="flex items-center justify-center gap-1 w-full py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors"
      >
        <Plus size={14} />
        {addLabel}
      </button>

      {(["classical", "quantum"] as PortKind[]).map((kind) => (
        <datalist key={kind} id={`${listId}-${kind}`}>
          {suggestions(kind).map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      ))}
    </div>
  );
}

export function MappingGroup({
  selected,
  onToggle,
  onRemove,
}: {
  selected: string[];
  onToggle: (val: string) => void;
  onRemove: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = Object.entries(mappingOptions).filter(
    ([option, desc]) => {
      const search = searchTerm.trim().toLowerCase();

      if (!search) return true;

      return (
        option.toLowerCase().includes(search) ||
        desc.toLowerCase().includes(search)
      );
    },
  );

  /**
   * Positioniert das Dropdown relativ zum Mapping-Button.
   */
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Wenn unten nicht genug Platz ist, öffnen wir nach oben.
    const openUp = spaceBelow < 350 && spaceAbove > spaceBelow;

    const maxHeight = Math.min(
      500,
      Math.max(250, openUp ? spaceAbove - 16 : spaceBelow - 16),
    );

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 320),
      zIndex: 9999,
      maxHeight,

      ...(openUp
        ? {
            bottom: window.innerHeight - rect.top + 4,
          }
        : {
            top: rect.bottom + 4,
          }),
    });
  };

  /**
   * Dropdown-Position beim Scrollen des Modal-Inhalts
   * und beim Resize aktualisieren.
   */
  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    const handleScroll = () => {
      updateDropdownPosition();
    };

    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener("scroll", handleScroll, true);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);

      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  /**
   * Click außerhalb schließt das Dropdown.
   *
   * Wichtig:
   * "click" statt "mousedown", damit ein Scrollen
   * nicht sofort das Dropdown schließt.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedButton = buttonRef.current?.contains(target);

      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedButton && !clickedMenu) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Suche fokussieren, wenn Dropdown geöffnet wird.
   */
  useEffect(() => {
    if (!isOpen) return;

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [isOpen]);

  /**
   * Highlight immer auf gültigen Eintrag setzen,
   * wenn sich die Suche verändert.
   */
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  /**
   * Aktuell hervorgehobenen Eintrag sichtbar machen.
   */
  useEffect(() => {
    if (!isOpen) return;

    const menu = menuRef.current;

    if (!menu) return;

    const optionElements = menu.querySelectorAll("[data-mapping-option]");

    const active = optionElements[highlightedIndex] as HTMLElement | undefined;

    active?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen, filteredOptions.length]);

  /**
   * Tastatur-Navigation.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();

      setIsOpen(false);
      setSearchTerm("");

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (filteredOptions.length === 0) {
        return;
      }

      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (filteredOptions.length === 0) {
        return;
      }

      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const option = filteredOptions[highlightedIndex]?.[0];

      if (option) {
        onToggle(option);
      }

      return;
    }
  };

  const handleToggle = (option: string) => {
    onToggle(option);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative mb-2 flex items-center gap-2 group"
    >
      <div className="flex-1 min-w-0">
        {/* Mapping Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            const next = !isOpen;

            setIsOpen(next);

            if (!next) {
              setSearchTerm("");
            }
          }}
          className="w-full flex items-center justify-between bg-white border rounded px-2 py-1.5 text-xs hover:border-blue-400 transition-colors"
        >
          <span className="truncate">
            {selected.length > 0 ? selected.join(" + ") : "Select mapping..."}
          </span>

          <ChevronDown
            size={14}
            className={`flex-shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {isOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={menuRef}
              style={dropdownStyle}
              className="bg-white border border-gray-200 rounded-md shadow-2xl overflow-hidden"
            >
              {/* Search */}
              <div className="p-2 border-b bg-gray-50">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to search..."
                  className="w-full border rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {/* Kleine Hilfe */}
                <div className="mt-1.5 text-[10px] text-gray-400">
                  ↑ ↓ navigate · Enter select · Esc close
                </div>
              </div>

              {/* Mapping Liste */}
              <div className="max-h-[500px] overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-5 text-xs text-gray-400 text-center">
                    No matching mappings
                  </div>
                ) : (
                  filteredOptions.map(([option, desc], index) => {
                    const isChecked = selected.includes(option);

                    const isHighlighted = index === highlightedIndex;

                    return (
                      <div
                        key={option}
                        data-mapping-option
                        title={desc}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleToggle(option)}
                        className={`
                            flex items-start gap-2
                            px-3 py-2.5
                            cursor-pointer
                            text-xs
                            border-b border-gray-50
                            transition-colors
                            ${isHighlighted ? "bg-blue-50" : "hover:bg-blue-50"}
                          `}
                      >
                        {/* Checkbox */}
                        <div
                          className={`
                              w-4 h-4 mt-0.5
                              border rounded
                              flex items-center
                              justify-center
                              flex-shrink-0
                              ${
                                isChecked
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-white border-gray-300"
                              }
                            `}
                        >
                          {isChecked && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>

                        {/* Mapping Text */}
                        <div className="min-w-0 flex-1">
                          <div
                            className={
                              isChecked
                                ? "font-bold text-blue-700 break-words"
                                : "text-gray-700 break-words"
                            }
                          >
                            {option}
                          </div>

                          {desc && desc !== option && (
                            <div className="text-[10px] text-gray-400 mt-0.5 break-words">
                              {desc}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 px-3 py-1.5 text-[10px] text-gray-400 flex justify-between">
                <span>{filteredOptions.length} mappings</span>

                <span>{selected.length} selected</span>
              </div>
            </div>,
            document.body,
          )}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 flex-shrink-0"
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
  onChange: (newMappings: string[][]) => void;
}) {
  const handleToggle = (groupIdx: number, val: string) => {
    const newMappings = [...mappings];
    const currentGroup = newMappings[groupIdx] || [];

    if (currentGroup.includes(val)) {
      newMappings[groupIdx] = currentGroup.filter((v) => v !== val);
    } else {
      newMappings[groupIdx] = [...currentGroup, val].sort();
    }

    onChange(newMappings);
  };

  const addGroup = () => onChange([...mappings, []]);

  const removeGroup = (idx: number) =>
    onChange(mappings.filter((_, i) => i !== idx));

  return (
    <div className="min-w-[300px] p-1">
      {mappings.map((group, idx) => (
        <MappingGroup
          key={idx}
          selected={group}
          onToggle={(val) => handleToggle(idx, val)}
          onRemove={() => removeGroup(idx)}
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
  onReorderProfiles: (fromIndex: number, toIndex: number) => void;
  onDuplicateProfile: (index: number) => void;
}) {
  const [localNodes, setLocalNodes] = useState<EditableNodeProfile[]>([]);

  const [profileName, setProfileName] = useState("");

  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(
    null,
  );

  const [duplicateWarning, setDuplicateWarning] = useState<{
    originalName: string;
    versionedName: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"saved" | "create">("create");

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
      setLocalNodes(toEditableNodesFromDomainProfile(initialProfile));
      setDuplicateWarning(null);
      setActiveTab("create");
      return;
    }

    setProfileName("");
    setLocalNodes([]);
    setDuplicateWarning(null);
    setActiveTab("create");
  }, [open, initialProfile]);

  const getVersionedProfileName = (name: string): string => {
    const normalizedNames = profiles.map((profile) =>
      profile.name.trim().toLowerCase(),
    );

    let version = 2;
    let candidate = `${name} v${version}`;

    while (normalizedNames.includes(candidate.toLowerCase())) {
      version++;
      candidate = `${name} v${version}`;
    }

    return candidate;
  };

  const saveProfileWithName = (finalName: string) => {
    const domainBlocks = localNodes.reduce(
      (acc, node) => {
        const cat = node.category || "Uncategorized";

        if (!acc[cat]) {
          acc[cat] = {
            description: "",
            content: [],
          };
        }

        const type = EditableNode;
        const isOperator = isOperatorCategory(node.category);

        const nodeData = {
          label: node.label,
          description: node.description,
          icon: node.icon,
          type: type,
          category: node.category,
          outputType: node.outputs.map((port) => port.type),
          inputPorts: isOperator ? node.inputs : [],
          outputPorts: node.outputs,
          properties: node.properties,
          constraints: node.constraints,
          mapping: node.mapping,
          completionGuaranteed: true,
          compactOptions: [true, false],
          isDataType: node.category === DATA_TYPES_CATEGORY,
          ...(isOperator && {
            operatorKind: defaultPortKind(node.category),
          }),
        };

        (acc[cat].content as any[]).push(nodeData);

        return acc;
      },
      {} as Record<string, CategoryEntry>,
    );

    const newProfile: DomainProfile = {
      name: finalName,
      domainBlocks,
    };

    onSave(newProfile);
    onClose();
  };

  const portNameDuplicates = localNodes.map(findDuplicatePortNames);

  // types defined in the profile, offered for the inputs and outputs
  const definedTypes = profileTypes(localNodes);

  const hasDuplicatePortNames = portNameDuplicates.some(
    (duplicates) => duplicates.size > 0,
  );

  const saveProfile = () => {
    if (hasDuplicatePortNames) return;

    const requestedName = profileName.trim() || "Untitled Profile";

    const existingProfile = profiles.find(
      (profile, index) =>
        index !== editingProfileIndex &&
        profile.name.trim().toLowerCase() === requestedName.toLowerCase(),
    );

    if (existingProfile) {
      const versionedName = getVersionedProfileName(requestedName);

      setDuplicateWarning({
        originalName: requestedName,
        versionedName,
      });

      return;
    }

    saveProfileWithName(requestedName);
  };

  const updateNode = (
    index: number,
    field: keyof EditableNodeProfile,
    value: any,
  ) => {
    setLocalNodes((prev) => {
      const copy: any = structuredClone(prev);

      copy[index] = {
        ...copy[index],
        [field]: value,
      };

      if (field === "category" && isDefaultIcon(copy[index].icon)) {
        copy[index].icon = defaultIcon(value);
      }

      // classical operators cannot have quantum ports
      if (field === "category" && value === CLASSICAL_OPERATORS_CATEGORY) {
        const toClassical = (port: NodeProfilePort) => ({
          ...port,
          kind: "classical",
          type: port.type === "quantum register" ? "" : port.type,
        });

        copy[index].inputs = copy[index].inputs.map(toClassical);
        copy[index].outputs = copy[index].outputs.map(toClassical);
      }

      return copy;
    });
  };

  const addNode = () => {
    const newNode: EditableNodeProfile = {
      label: "",
      description: "",
      icon: "QAOA.png",
      visible: true,
      category: "",
      inputs: [],
      outputs: [],
      properties: [],
      constraints: [],
      mapping: [[]],
      originalLabel: "",
      originalDescription: "",
      originalIcon: "",
    };

    // a new block goes to the top of the list
    setLocalNodes([newNode, ...localNodes]);
  };

  const removeNode = (index: number) => {
    setLocalNodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIconUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => updateNode(index, "icon", reader.result);

    reader.readAsDataURL(file);
  };

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

    const dataStr = JSON.stringify(
      {
        name: profile.name,
        nodes,
      },
      null,
      2,
    );

    const blob = new Blob([dataStr], {
      type: "application/json",
    });

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
      className="w-[92vw] max-w-[92vw]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            {activeTab === "saved"
              ? `${profiles.length} saved profile${
                  profiles.length === 1 ? "" : "s"
                }`
              : profileName
                ? `Editing: ${profileName}`
                : "New domain profile"}
          </div>

          <div className="space-x-2">
            <button
              className={`btn ${
                duplicateWarning || hasDuplicatePortNames
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "btn-primary"
              }`}
              onClick={saveProfile}
              disabled={
                !!duplicateWarning ||
                hasDuplicatePortNames ||
                activeTab !== "create"
              }
            >
              Save Profile
            </button>

            <button className="btn btn-secondary" onClick={onClose}>
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
              onClick={() => setActiveTab("saved")}
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
                    activeTab === "saved"
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
              onClick={() => setActiveTab("create")}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "create"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {editingProfileIndex !== null ? "Edit Profile" : "Create Profile"}

              {activeTab === "create" && (
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
                    Edit, duplicate, export, delete or reorder your stored
                    domain profiles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileName("");
                    setLocalNodes([]);
                    setDuplicateWarning(null);
                    setActiveTab("create");
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
                    No saved profiles
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Create your first domain profile to see it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile, index) => (
                    <div
                      key={`${profile.name}-${index}`}
                      draggable
                      onDragStart={() => setDraggedProfileIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDropProfile(index)}
                      onDragEnd={() => setDraggedProfileIndex(null)}
                      className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm transition ${
                        editingProfileIndex === index
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="cursor-grab text-gray-400 hover:text-gray-600"
                        title="Drag to reorder"
                      >
                        <GripVertical size={18} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {profile.name}
                        </div>

                        <div className="text-xs text-gray-500 mt-0.5">
                          {Object.keys(profile.domainBlocks ?? {}).length}{" "}
                          categories
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            onEditProfile(index);
                            setActiveTab("create");
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            onDuplicateProfile(index);
                            setActiveTab("create");
                          }}
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          onClick={() => exportProfile(profile)}
                        >
                          Export
                        </button>

                        <button
                          type="button"
                          className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteProfile(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
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
                      value={profileName}
                      placeholder="Insert name..."
                      onChange={(e) => {
                        setProfileName(e.target.value);

                        if (duplicateWarning) {
                          setDuplicateWarning(null);
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
                    Add Domain Block
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = JSON.stringify(
                        {
                          name: profileName,
                          nodes: localNodes,
                        },
                        null,
                        2,
                      );

                      const blob = new Blob([dataStr], {
                        type: "application/json",
                      });

                      const url = URL.createObjectURL(blob);

                      const a = document.createElement("a");

                      a.href = url;
                      a.download = `${profileName || "domain_profile"}.json`;

                      a.click();

                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Export Profile
                  </button>

                  <DomainProfileRepositoryPicker
                    onLoad={(profile) => {
                      setProfileName(
                        profile.version
                          ? `${profile.name} v${profile.version}`
                          : profile.name,
                      );

                      setLocalNodes(toEditableNodes(profile));

                      setDuplicateWarning(null);
                    }}
                  />

                  <label className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm cursor-pointer">
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

                            const sanitizedNodes: EditableNodeProfile[] =
                              json.nodes.map((n: any) => toEditableNode(n));

                            setProfileName(json.name);

                            setLocalNodes(sanitizedNodes);

                            setDuplicateWarning(null);
                          } catch (err) {
                            console.error(err);

                            alert("Failed to parse JSON file.");
                          }
                        };

                        reader.readAsText(file);

                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </section>

              {/* Duplicate input/output names */}
              {hasDuplicatePortNames && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                  <h3 className="text-sm font-semibold text-red-900">
                    Input and output names must be unique
                  </h3>

                  <p className="mt-1 text-sm text-red-800">
                    Rename the duplicates in{" "}
                    {localNodes
                      .filter((_, i) => portNameDuplicates[i].size > 0)
                      .map((node, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <strong>{node.label || "unnamed block"}</strong>
                        </span>
                      ))}{" "}
                    before saving.
                  </p>
                </div>
              )}

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-900">
                        Profile name already exists
                      </h3>

                      <p className="mt-1 text-sm text-yellow-800">
                        A profile named{" "}
                        <strong>"{duplicateWarning.originalName}"</strong>{" "}
                        already exists.
                      </p>

                      <p className="mt-1 text-sm text-yellow-800">
                        Would you like to save this profile as{" "}
                        <strong>"{duplicateWarning.versionedName}"</strong>?
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            saveProfileWithName(duplicateWarning.versionedName);

                            setDuplicateWarning(null);
                          }}
                        >
                          Save as {duplicateWarning.versionedName}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setDuplicateWarning(null)}
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
                    Configure the nodes, inputs, outputs, properties,
                    constraints and mappings.
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-auto w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                      <tr>
                        <th className="p-2 border min-w-[200px]">Name</th>

                        <th className="p-2 border min-w-[110px]">Icon</th>

                        <th className="p-2 border min-w-[180px]">Category</th>

                        <th className="p-2 border min-w-[260px]">Inputs</th>

                        <th className="p-2 border min-w-[260px]">Outputs</th>

                        <th className="p-2 border min-w-[260px]">Properties</th>

                        <th className="p-2 border min-w-[300px]">
                          Constraints
                        </th>

                        <th className="p-2 border min-w-[220px]">Mapping</th>

                        <th className="p-2 border w-10" aria-label="Delete" />
                      </tr>
                    </thead>

                    <tbody>
                      {localNodes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-12 text-center text-gray-400 italic"
                          >
                            No blocks added yet. Click "Add Domain Block" to
                            begin.
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
                            {/* the upper left icon of the block header */}
                            <td className="p-2 border text-center">
                              <div className="relative group w-16 h-16 mx-auto">
                                <label
                                  className="block w-full h-full cursor-pointer"
                                  title="Upload the icon shown in the upper left of the block"
                                >
                                  <img
                                    src={domainBlockHeaderIcon(node)}
                                    className="w-full h-full object-contain"
                                    alt="icon"
                                  />

                                  <span className="absolute inset-0 rounded bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ImageIcon className="w-5 h-5 text-white" />
                                  </span>

                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      handleIconUpload(e, idx);
                                      // the same file can be chosen again
                                      e.target.value = "";
                                    }}
                                  />
                                </label>

                                {uploadedHeaderIcon(node.icon) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateNode(
                                        idx,
                                        "icon",
                                        defaultIcon(node.category),
                                      )
                                    }
                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                                    title="Remove the icon (use the default)"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="p-2 border">
                              <select
                                value={node.category}
                                onChange={(e) =>
                                  updateNode(idx, "category", e.target.value)
                                }
                                className="border rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="" disabled>
                                  Choose a category...
                                </option>

                                <option value={DATA_TYPES_CATEGORY}>
                                  Data Types
                                </option>

                                <option value={QUANTUM_OPERATORS_CATEGORY}>
                                  Quantum Operator
                                </option>

                                <option value={CLASSICAL_OPERATORS_CATEGORY}>
                                  Classical Operator
                                </option>
                              </select>
                            </td>

                            {/* Inputs */}
                            <td className="p-2 border text-center">
                              {isOperatorCategory(node.category) ? (
                                <PortEditor
                                  ports={node.inputs}
                                  category={node.category}
                                  addLabel="Add Input"
                                  duplicateNames={portNameDuplicates[idx]}
                                  definedTypes={definedTypes}
                                  checkDefined
                                  onChange={(newInputs) =>
                                    updateNode(idx, "inputs", newInputs)
                                  }
                                />
                              ) : (
                                <span className="text-xs text-gray-400 italic">
                                  Only for operators
                                </span>
                              )}
                            </td>

                            {/* Outputs */}
                            <td className="p-2 border text-center">
                              <PortEditor
                                ports={node.outputs}
                                category={node.category}
                                addLabel="Add Output"
                                duplicateNames={portNameDuplicates[idx]}
                                definedTypes={definedTypes}
                                onChange={(newOutputs) =>
                                  updateNode(idx, "outputs", newOutputs)
                                }
                              />
                            </td>

                            {/* Properties */}
                            <td className="p-2 border text-center">
                              <PropertyEditor
                                properties={node.properties || []}
                                onChange={(newProperties) =>
                                  updateNode(idx, "properties", newProperties)
                                }
                              />
                            </td>

                            {/* Constraints */}
                            <td className="p-2 border text-center">
                              <ConstraintEditor
                                constraints={node.constraints || []}
                                availableProperties={node.properties || []}
                                onChange={(newConstraints) =>
                                  updateNode(idx, "constraints", newConstraints)
                                }
                              />
                            </td>

                            {/* Mapping */}
                            <td className="p-2 border text-center">
                              <MappingEditor
                                mappings={node.mapping}
                                onChange={(newMappings) =>
                                  updateNode(idx, "mapping", newMappings)
                                }
                              />
                            </td>

                            {/* Delete */}
                            <td className="p-2 border text-center">
                              <button
                                type="button"
                                onClick={() => removeNode(idx)}
                                className="bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-200"
                                title={`Delete ${node.label || "this block"}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
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
