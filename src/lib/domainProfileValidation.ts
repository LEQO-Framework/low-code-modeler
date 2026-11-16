/**
 * Checks a domain profile in the editor before it is saved. Every error blocks
 * saving.
 *
 * The result has one entry per block and per enum (aligned with the editor's lists)
 * so that the editor can mark the offending fields, plus a flat list of errors for
 * the summary above the tables.
 */

export const DATA_TYPES_CATEGORY = "dataTypes";
export const QUANTUM_OPERATORS_CATEGORY = "Quantum Operators";
export const CLASSICAL_OPERATORS_CATEGORY = "Classical Operators";

export const QUANTUM_REGISTER_TYPE = "quantum register";

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

export type PortKind = "quantum" | "classical";

export interface NodeProfilePort {
  name: string;
  type: string;
  kind: PortKind;
  optional: boolean;
}

export interface NodeProfileProperty {
  name: string;
  type: string;
  required?: boolean;
}

export interface NodeProfileConstraint {
  propertyName: string;
  constraint: string;
  value?: string;
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

export interface EditableEnumProfile {
  id: string;
  name: string;
  /**
   * Name that properties of this enum use as their type and differs from
   * name while the typed name is invalid (empty, duplicate, existing type).
   */
  referencedName: string;
  values: string[];
}

export const isOperatorCategory = (category: string) =>
  category === QUANTUM_OPERATORS_CATEGORY ||
  category === CLASSICAL_OPERATORS_CATEGORY;

/** Entries (name of enums or values of an enum) that are used multiple times */
export function findDuplicates(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  entries.forEach((entry) => {
    const trimmed = entry.trim();

    if (!trimmed) return;

    if (seen.has(trimmed)) duplicates.add(trimmed);

    seen.add(trimmed);
  });

  return duplicates;
}

/**
 * Names that are used by more than one of the block's inputs and outputs.
 * Inputs and outputs share one namespace.
 */
export function findDuplicatePortNames(node: EditableNodeProfile): Set<string> {
  return findDuplicates(
    [
      ...(isOperatorCategory(node.category) ? node.inputs : []),
      ...node.outputs,
    ].map((port) => port.name),
  );
}

/**
 * Types defined in the profile, for the inputs and outputs of its blocks: the output
 * types of the data types first, then those of the operators (without duplicates).
 */
export function profileTypes(nodes: EditableNodeProfile[]): string[] {
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

/**
 * Enum types defined in the profile.
 * The names of the enums (without duplicates or empty names).
 */
export function profileEnumTypes(enums: EditableEnumProfile[]): string[] {
  const types = enums.map((e) => e.name.trim());
  return [...new Set(types)].filter(Boolean);
}

/**
 * Properties a constraint can refer to: properties that are not enums (an enum
 * already restricts the values), and "length(<property>)" for arrays.
 */
export function constraintTargets(
  properties: NodeProfileProperty[],
  enumTypes: string[],
): string[] {
  return properties
    .filter((prop) => !enumTypes.includes(prop.type))
    .flatMap((prop) =>
      prop.type.toLowerCase().includes("array") || prop.type.includes("[]")
        ? [prop.name, `length(${prop.name})`]
        : [prop.name],
    );
}

/** Problems of a property, null if the field is fine. */
export interface PropertyIssues {
  name: string | null;
  type: string | null;
}

/** Warnings of a port, null if the field is fine. */
export interface PortWarnings {
  name: string | null;
  type: string | null;
}

export interface BlockValidation {
  name: string | null;
  category: string | null;
  /** Problem of the block's outputs as a whole (none defined). */
  outputs: string | null;
  /** Warning of the block's outputs as a whole (none defined). */
  outputsWarning: string | null;
  duplicatePortNames: Set<string>;
  inputWarnings: PortWarnings[];
  outputWarnings: PortWarnings[];
  properties: PropertyIssues[];
  constraints: (string | null)[];
}

export interface EnumValidation {
  name: string | null;
  duplicateValues: Set<string>;
}

export interface ProfileIssue {
  /** What the issue is about, e.g. 'Block "Graph"' or "Profile". */
  subject: string;
  message: string;
}

export interface DomainProfileValidation {
  blocks: BlockValidation[];
  enums: EnumValidation[];
  /** Enums deleted while editing whose name is not used by another enum. */
  deletedEnumTypes: string[];
  /** Problems that block saving. */
  errors: ProfileIssue[];
  /** Hints at something probably unintended, saving is still possible. */
  warnings: ProfileIssue[];
}

const blockSubject = (node: EditableNodeProfile, index: number) =>
  node.label.trim()
    ? `Block "${node.label.trim()}"`
    : `Unnamed block ${index + 1}`;

const enumSubject = (domainEnum: EditableEnumProfile, index: number) =>
  domainEnum.name.trim()
    ? `Enum "${domainEnum.name.trim()}"`
    : `Unnamed enum ${index + 1}`;

export function validateDomainProfile({
  profileName,
  otherProfileNames,
  nodes,
  enums,
  removedEnumNames,
}: {
  profileName: string;
  /** Names of the saved profiles except the one being edited. */
  otherProfileNames: string[];
  nodes: EditableNodeProfile[];
  enums: EditableEnumProfile[];
  removedEnumNames: string[];
}): DomainProfileValidation {
  const errors: ProfileIssue[] = [];
  const warnings: ProfileIssue[] = [];

  const definedTypes = profileTypes(nodes);
  const enumTypes = profileEnumTypes(enums);

  // ---------- Profile ----------
  if (!profileName.trim()) {
    warnings.push({
      subject: "Profile",
      message: 'has no name and is saved as "Untitled Profile".',
    });
  }
  // the same comparison as when saving, which then offers a versioned name
  const savedName = profileName.trim() || "Untitled Profile";
  if (
    otherProfileNames.some(
      (name) => name.trim().toLowerCase() === savedName.toLowerCase(),
    )
  ) {
    warnings.push({
      subject: "Profile",
      message: `"${savedName}" already exists. Saving offers a new version name instead.`,
    });
  }
  if (nodes.length === 0) {
    warnings.push({ subject: "Profile", message: "has no domain blocks." });
  }

  // ---------- Enums ----------
  // an enum is used as a type, so its name must not be a type already
  const existingTypes = [
    ...PROPERTY_TYPES,
    QUANTUM_REGISTER_TYPE,
    ...definedTypes,
  ];
  const enumNameDuplicates = findDuplicates(enums.map((e) => e.name));
  const propertyTypes = new Set(
    nodes.flatMap((node) => node.properties.map((prop) => prop.type)),
  );

  const enumResults = enums.map((domainEnum, i): EnumValidation => {
    const subject = enumSubject(domainEnum, i);
    const trimmed = domainEnum.name.trim();
    const name = !trimmed
      ? "Name must not be empty"
      : enumNameDuplicates.has(trimmed)
        ? "Name must be unique"
        : existingTypes.includes(trimmed)
          ? "Name is already a type"
          : null;
    const duplicateValues = findDuplicates(domainEnum.values);
    const valueProblem =
      domainEnum.values.length === 0
        ? "needs at least one value."
        : domainEnum.values.some((value) => !value.trim())
          ? "has an empty value."
          : duplicateValues.size > 0
            ? `has duplicate values (${[...duplicateValues].join(", ")}).`
            : null;

    if (name) errors.push({ subject, message: `${name.toLowerCase()}.` });
    if (valueProblem) errors.push({ subject, message: valueProblem });

    if (!name && !propertyTypes.has(domainEnum.referencedName)) {
      warnings.push({ subject, message: "is not used by any property." });
    }
    if (!valueProblem && domainEnum.values.length === 1) {
      warnings.push({
        subject,
        message: "has only one value, so there is nothing to choose.",
      });
    }

    return { name, duplicateValues };
  });

  // a deleted name can be used for another (added or renamed) enum
  const deletedEnumTypes = removedEnumNames.filter(
    (name) => !enums.some((domainEnum) => domainEnum.referencedName === name),
  );

  // ---------- Blocks ----------
  const labelCounts = new Map<string, number>();
  nodes.forEach((node) => {
    const key = node.label.trim().toLowerCase();
    if (key) labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1);
  });

  const blockResults = nodes.map((node, i): BlockValidation => {
    const subject = blockSubject(node, i);
    const error = (message: string) => errors.push({ subject, message });
    const warn = (message: string) => warnings.push({ subject, message });
    const isOperator = isOperatorCategory(node.category);

    // name and category
    const label = node.label.trim();
    const name = !label
      ? "Name must not be empty"
      : (labelCounts.get(label.toLowerCase()) ?? 0) > 1
        ? "Name must be unique"
        : null;
    if (name) error(`${name.toLowerCase()}.`);

    const category = node.category ? null : "Choose a category";
    if (category) error("has no category.");

    // inputs and outputs
    const duplicatePortNames = findDuplicatePortNames(node);
    if (duplicatePortNames.size > 0) {
      error(
        `uses the input/output name${duplicatePortNames.size > 1 ? "s" : ""} ${[
          ...duplicatePortNames,
        ]
          .map((n) => `"${n}"`)
          .join(", ")} more than once.`,
      );
    }

    const outputs =
      node.category === DATA_TYPES_CATEGORY && node.outputs.length === 0
        ? "A data type needs at least one output"
        : null;
    if (outputs) error("is a data type but has no output.");

    const outputsWarning =
      isOperator && node.outputs.length === 0
        ? "No output, the result cannot be used"
        : null;
    if (outputsWarning) warn("has no output, so its result cannot be used.");

    const checkPorts = (ports: NodeProfilePort[], kind: "input" | "output") =>
      ports.map((port, p): PortWarnings => {
        const portName = port.name.trim();
        const type = port.type.trim();
        const portLabel = portName
          ? `${kind} "${portName}"`
          : `${kind} ${p + 1}`;
        // inputs get their values from the outputs of the profile's blocks
        const undefinedType =
          kind === "input" &&
          port.kind === "classical" &&
          type !== "" &&
          !definedTypes.includes(type) &&
          !PROPERTY_TYPES.some((t) => t.toLowerCase() === type.toLowerCase());

        if (!portName) warn(`${portLabel} has no name.`);
        if (!type) warn(`${portLabel} has no type.`);
        if (undefinedType) {
          warn(
            `${portLabel} uses the type "${type}", which no block of this profile outputs.`,
          );
        }

        return {
          name: portName ? null : "No name, shown as a number",
          type: !type
            ? "No type set"
            : undefinedType
              ? "No block of this profile outputs this type"
              : null,
        };
      });

    // inputs are only saved for operators
    const inputWarnings = isOperator ? checkPorts(node.inputs, "input") : [];
    const outputWarnings = checkPorts(node.outputs, "output");

    // properties
    const propertyDuplicates = findDuplicates(
      node.properties.map((prop) => prop.name),
    );
    const properties = node.properties.map((prop, p): PropertyIssues => {
      const propName = prop.name.trim();
      const issues: PropertyIssues = {
        name: !propName
          ? "Name must not be empty"
          : propertyDuplicates.has(propName)
            ? "Name must be unique"
            : null,
        type: !prop.type
          ? "Choose a type"
          : deletedEnumTypes.includes(prop.type)
            ? "Enum was deleted"
            : null,
      };
      const propLabel = propName
        ? `property "${propName}"`
        : `property ${p + 1}`;
      if (!propName) error(`${propLabel} has no name.`);
      if (!prop.type) error(`${propLabel} has no type.`);
      if (deletedEnumTypes.includes(prop.type)) {
        error(`${propLabel} uses the deleted enum "${prop.type}".`);
      }
      return issues;
    });
    if (propertyDuplicates.size > 0) {
      error(
        `uses the property name${propertyDuplicates.size > 1 ? "s" : ""} ${[
          ...propertyDuplicates,
        ]
          .map((n) => `"${n}"`)
          .join(", ")} more than once.`,
      );
    }

    // constraints: incomplete ones are ignored when checking values
    const targets = constraintTargets(node.properties, enumTypes);
    const constraints = node.constraints.map((con, c) => {
      const problem = !con.propertyName
        ? "Choose a property"
        : !targets.includes(con.propertyName)
          ? `Property "${con.propertyName}" does not exist (anymore)`
          : !con.constraint
            ? "Choose a comparison"
            : !String(con.value ?? "").trim()
              ? "Enter a value"
              : null;
      if (problem) {
        error(
          `constraint ${c + 1}: ${problem.charAt(0).toLowerCase()}${problem.slice(1)}.`,
        );
      } else {
        const target = con.propertyName.replace(/^length\((.*)\)$/, "$1");
        const prop = node.properties.find((p) => p.name === target);
        if (prop && !prop.required) {
          warn(
            `constraint ${c + 1} is only checked if the optional property "${target}" is filled in.`,
          );
        }
      }
      return problem;
    });

    return {
      name,
      category,
      outputs,
      outputsWarning,
      duplicatePortNames,
      inputWarnings,
      outputWarnings,
      properties,
      constraints,
    };
  });

  return {
    blocks: blockResults,
    enums: enumResults,
    deletedEnumTypes,
    errors,
    warnings,
  };
}
