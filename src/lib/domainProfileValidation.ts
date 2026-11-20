/**
 * Checks a domain profile in the editor before it is saved. Errors block saving,
 * warnings only hint at something that is probably unintended.
 *
 * The result has one entry per block and per enum (aligned with the editor's lists)
 * so that the editor can mark the offending fields, plus flat lists of errors and
 * warnings for the summaries above the tables.
 */

import { INTEGER_TYPES, NUMBER_TYPES } from "./propertyConstraints";

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

const LENGTH = /^length\((.*)\)$/;

/** Property a constraint refers to, also for "length(<property>)". */
const constraintProperty = (
  con: NodeProfileConstraint,
  properties: NodeProfileProperty[],
) =>
  properties.find(
    (prop) => prop.name === con.propertyName.replace(LENGTH, "$1"),
  );

/** "int", "number", ... or "text" (only == and != can be checked), else null. */
function constraintDomain(
  con: NodeProfileConstraint,
  properties: NodeProfileProperty[],
): "integer" | "number" | "text" | null {
  if (LENGTH.test(con.propertyName)) return "integer";
  const type = (constraintProperty(con, properties)?.type ?? "")
    .trim()
    .toLowerCase();
  if (INTEGER_TYPES.includes(type)) return "integer";
  if (NUMBER_TYPES.includes(type)) return "number";
  if (["string", "boolean", "file"].includes(type)) return "text";
  return null;
}

/**
 * True if the value of a constraint is a literal. It can also be another
 * property (or its length), which is only known when checking the values.
 */
const hasLiteralValue = (
  con: NodeProfileConstraint,
  properties: NodeProfileProperty[],
) => {
  const value = String(con.value ?? "").trim();
  return !properties.some((prop) => prop.name === value.replace(LENGTH, "$1"));
};

/** Problem of a complete constraint's value with its property's type, or null. */
function constraintValueProblem(
  con: NodeProfileConstraint,
  properties: NodeProfileProperty[],
): string | null {
  const domain = constraintDomain(con, properties);
  const value = String(con.value ?? "").trim();
  const type = constraintProperty(con, properties)?.type;

  if (domain === "text" && !["==", "!="].includes(con.constraint)) {
    return `"${con.constraint}" cannot compare ${type} values, use == or !=`;
  }
  if (!hasLiteralValue(con, properties)) return null;
  if (LENGTH.test(con.propertyName) && !/^\d+$/.test(value)) {
    return "A length must be a whole number of at least 0";
  }
  if ((domain === "integer" || domain === "number") && !isNumeric(value)) {
    return "Value must be a number";
  }
  if (type?.toLowerCase() === "boolean" && !/^(true|false)$/i.test(value)) {
    return "Value must be true or false";
  }
  return null;
}

const isNumeric = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value));

const constraintValue = (con: NodeProfileConstraint) =>
  String(con.value ?? "").trim();

/**
 * Indexes of constraints (with literal values, not contradicting each other) of
 * one property that have no effect because the others already ensure them
 */
function redundantConstraints(
  cons: NodeProfileConstraint[],
  domain: "integer" | "number" | "text" | null,
): number[] {
  const numeric = domain === "integer" || domain === "number";
  const equal = cons.findIndex((con) => con.constraint === "==");

  // a fixed value makes every other constraint pointless
  if (equal !== -1) return cons.map((_, i) => i).filter((i) => i !== equal);

  // how strict a bound is: higher is stricter, whole numbers "> 2" = ">= 3"
  const strictness = (con: NodeProfileConstraint) => {
    const n = Number(constraintValue(con));
    const exclusive = con.constraint === ">" || con.constraint === "<";
    const lower = con.constraint.startsWith(">");
    if (domain === "integer") {
      const bound = lower
        ? exclusive
          ? Math.floor(n) + 1
          : Math.ceil(n)
        : exclusive
          ? Math.ceil(n) - 1
          : Math.floor(n);
      return { score: lower ? bound : -bound, tie: 0 };
    }
    return { score: lower ? n : -n, tie: exclusive ? 1 : 0 };
  };

  const redundant: number[] = [];
  [">", "<"].forEach((side) => {
    if (!numeric) return;
    const bounds = cons
      .map((con, i) => ({ con, i }))
      .filter(({ con }) => con.constraint.startsWith(side));
    if (bounds.length < 2) return;
    const strictest = bounds.reduce((best, b) => {
      const s = strictness(b.con);
      const t = strictness(best.con);
      return s.score > t.score || (s.score === t.score && s.tie > t.tie)
        ? b
        : best;
    });
    bounds.forEach(({ i }) => i !== strictest.i && redundant.push(i));
  });

  // "!= x" twice, or outside the allowed range
  const seen = new Set<string>();
  cons.forEach((con, i) => {
    if (con.constraint !== "!=") return;
    const key = numeric
      ? String(Number(constraintValue(con)))
      : constraintValue(con);
    const n = Number(constraintValue(con));
    const outside = cons.some(
      (other) =>
        numeric &&
        ((other.constraint === ">" && n <= Number(constraintValue(other))) ||
          (other.constraint === ">=" && n < Number(constraintValue(other))) ||
          (other.constraint === "<" && n >= Number(constraintValue(other))) ||
          (other.constraint === "<=" && n > Number(constraintValue(other))) ||
          (domain === "integer" && !Number.isInteger(n))),
    );
    if (seen.has(key) || outside) redundant.push(i);
    seen.add(key);
  });

  return redundant;
}

/**
 * True if no value can fulfil all constraints (with literal values) of one
 * property, e.g. "> 5" and "< 3", or "== 2" and "!= 2".
 */
function contradict(
  cons: NodeProfileConstraint[],
  domain: "integer" | "number" | "text" | null,
): boolean {
  const numeric = domain === "integer" || domain === "number";
  const normalize = (value: string) =>
    numeric ? String(Number(value)) : value.trim();

  const equal = new Set<string>();
  const notEqual = new Set<string>();
  let lower = -Infinity;
  let lowerInclusive = true;
  let upper = Infinity;
  let upperInclusive = true;

  cons.forEach((con) => {
    const value = String(con.value ?? "");
    const n = Number(value);
    switch (con.constraint) {
      case "==":
        equal.add(normalize(value));
        break;
      case "!=":
        notEqual.add(normalize(value));
        break;
      case ">":
      case ">=":
        if (n > lower || (n === lower && con.constraint === ">")) {
          lower = n;
          lowerInclusive = con.constraint === ">=";
        }
        break;
      case "<":
      case "<=":
        if (n < upper || (n === upper && con.constraint === "<")) {
          upper = n;
          upperInclusive = con.constraint === "<=";
        }
        break;
    }
  });

  // whole numbers: "> 2" means ">= 3"
  if (domain === "integer") {
    lower = lowerInclusive ? Math.ceil(lower) : Math.floor(lower) + 1;
    upper = upperInclusive ? Math.floor(upper) : Math.ceil(upper) - 1;
    lowerInclusive = upperInclusive = true;
  }
  const inRange = (n: number) =>
    (lowerInclusive ? n >= lower : n > lower) &&
    (upperInclusive ? n <= upper : n < upper) &&
    (domain !== "integer" || Number.isInteger(n));

  if (equal.size > 1) return true;
  if ([...equal].some((value) => notEqual.has(value))) return true;
  if (numeric && [...equal].some((value) => !inRange(Number(value)))) {
    return true;
  }
  if (!numeric) return false;
  if (lower > upper) return true;
  if (lower === upper) {
    // only one value is left, which may also be excluded
    return (
      !(lowerInclusive && upperInclusive) ||
      notEqual.has(normalize(String(lower)))
    );
  }
  return false;
}

/** Problems of a property, null if the field is fine. */
export interface PropertyIssues {
  name: string | null;
  type: string | null;
}

/** Problems of a port, null if the field is fine. */
export interface PortIssues {
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
  inputPorts: PortIssues[];
  outputPorts: PortIssues[];
  properties: PropertyIssues[];
  constraints: (string | null)[];
  constraintWarnings: (string | null)[];
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
  /** Problem of the profile name, null if it is fine. */
  profileName: string | null;
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
  const trimmedProfileName = profileName.trim();
  const profileNameExists = otherProfileNames.some(
    (name) => name.trim().toLowerCase() === trimmedProfileName.toLowerCase(),
  );
  const profileNameProblem = !trimmedProfileName
    ? "Name must not be empty"
    : profileNameExists
      ? "A profile with this name already exists"
      : null;
  if (!trimmedProfileName) {
    errors.push({ subject: "Profile", message: "has no name." });
  } else if (profileNameExists) {
    errors.push({
      subject: "Profile",
      message: `"${trimmedProfileName}" already exists, choose another name.`,
    });
  }
  if (nodes.length === 0) {
    errors.push({
      subject: "Profile",
      message: "has no domain blocks, add at least one.",
    });
  }

  // ---------- Enums ----------
  // an enum is used as a type, so its name must not be a type already
  const existingTypes = [
    ...PROPERTY_TYPES,
    QUANTUM_REGISTER_TYPE,
    ...definedTypes,
  ];
  const enumNameDuplicates = findDuplicates(enums.map((e) => e.name));
  const reportedEnumNames = new Set<string>();
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

    if (name && !enumNameDuplicates.has(trimmed)) {
      errors.push({ subject, message: `${name.toLowerCase()}.` });
    } else if (name && !reportedEnumNames.has(trimmed)) {
      reportedEnumNames.add(trimmed);
      errors.push({
        subject,
        message: `is the name of ${enums.filter((e) => e.name.trim() === trimmed).length} enums, it must be unique.`,
      });
    }
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
  const reportedLabels = new Set<string>();

  const blockResults = nodes.map((node, i): BlockValidation => {
    const subject = blockSubject(node, i);
    const error = (message: string) => errors.push({ subject, message });
    const warn = (message: string) => warnings.push({ subject, message });
    const isOperator = isOperatorCategory(node.category);

    // name and category
    const label = node.label.trim();
    const labelCount = labelCounts.get(label.toLowerCase()) ?? 0;
    const name = !label
      ? "Name must not be empty"
      : labelCount > 1
        ? "Name must be unique"
        : null;
    if (!label) {
      error("name must not be empty.");
    } else if (labelCount > 1 && !reportedLabels.has(label.toLowerCase())) {
      reportedLabels.add(label.toLowerCase());
      error(`is the name of ${labelCount} blocks, it must be unique.`);
    }

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
      ports.map((port, p): PortIssues => {
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

        if (!portName) error(`${portLabel} has no name.`);
        if (!type) error(`${portLabel} has no type.`);
        if (undefinedType) {
          error(
            `${portLabel} uses the type "${type}", which no block of this profile outputs.`,
          );
        }

        return {
          name: portName ? null : "Name must not be empty",
          type: !type
            ? "Choose a type"
            : undefinedType
              ? "No block of this profile outputs this type"
              : null,
        };
      });

    // inputs are only saved for operators
    const inputPorts = isOperator ? checkPorts(node.inputs, "input") : [];
    const outputPorts = checkPorts(node.outputs, "output");

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
    const constraintWarnings: (string | null)[] = node.constraints.map(
      () => null,
    );
    const constraints = node.constraints.map((con, c) => {
      const problem = !con.propertyName
        ? "Choose a property"
        : !targets.includes(con.propertyName)
          ? `Property "${con.propertyName}" does not exist (anymore)`
          : !con.constraint
            ? "Choose a comparison"
            : !String(con.value ?? "").trim()
              ? "Enter a value"
              : constraintValueProblem(con, node.properties);
      if (problem) {
        error(
          `constraint ${c + 1}: ${problem.charAt(0).toLowerCase()}${problem.slice(1)}.`,
        );
      } else {
        const prop = constraintProperty(con, node.properties);
        if (prop && !prop.required) {
          constraintWarnings[c] = "Only checked if the property is filled in";
          warn(
            `constraint ${c + 1} is only checked if the optional property "${prop.name}" is filled in.`,
          );
        }
      }
      return problem;
    });

    // valid constraints with literal values, by the property they constrain
    const byTarget = new Map<string, number[]>();
    node.constraints.forEach((con, c) => {
      if (constraints[c] || !hasLiteralValue(con, node.properties)) return;
      byTarget.set(con.propertyName, [
        ...(byTarget.get(con.propertyName) ?? []),
        c,
      ]);
    });
    byTarget.forEach((indexes, target) => {
      const cons = indexes.map((c) => node.constraints[c]);
      const domain = constraintDomain(cons[0], node.properties);
      if (indexes.length < 2) return;
      if (!contradict(cons, domain)) {
        redundantConstraints(cons, domain).forEach((r) => {
          constraints[indexes[r]] =
            "Redundant, the other constraints already ensure it";
          // the error replaces the "optional property" warning
          constraintWarnings[indexes[r]] = null;
          error(
            `constraint ${indexes[r] + 1} on "${target}" is redundant, the other constraints already ensure it. Remove it.`,
          );
        });
        return;
      }
      indexes.forEach((c) => {
        constraints[c] = "Contradicts another constraint";
      });
      error(
        `constraints ${indexes.map((c) => c + 1).join(", ")} on "${target}" contradict each other, no value can fulfil all of them.`,
      );
    });

    return {
      name,
      category,
      outputs,
      outputsWarning,
      duplicatePortNames,
      inputPorts,
      outputPorts,
      properties,
      constraints,
      constraintWarnings,
    };
  });

  return {
    profileName: profileNameProblem,
    blocks: blockResults,
    enums: enumResults,
    deletedEnumTypes,
    errors,
    warnings,
  };
}
