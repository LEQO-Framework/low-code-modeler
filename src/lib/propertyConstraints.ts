/**
 * Checks the property values of a domain profile block (editable node) against the
 * types and constraints of its profile, e.g. "Value > 0" or "length(Value) <= 8". Used
 * by the node itself (to mark a field) and by the model validation.
 *
 * The left side of a constraint is a property or "length(<property>)"; the right side
 * is a literal, another property, or "length(<property>)". Numbers are compared as
 * numbers, properties of type date as dates, anything else as text (== and != only).
 */

export interface ProfileProperty {
  name: string;
  type?: string;
  required?: boolean;
}

export interface ProfileConstraint {
  propertyName: string;
  constraint: string;
  value: string;
}

const same = (a: string | undefined, b: string | undefined) =>
  (a ?? "").trim() === (b ?? "").trim();

const isBlank = (v: unknown) => String(v ?? "").trim() === "";

const isNumeric = (v: string) => v.trim() !== "" && Number.isFinite(Number(v));

const typeOf = (prop: ProfileProperty | undefined) =>
  (prop?.type ?? "").trim().toLowerCase();

const INTEGER_TYPES = ["int", "integer", "long"];
const NUMBER_TYPES = ["float", "double", "number", "real", "decimal"];

const isArrayType = (prop: ProfileProperty | undefined) =>
  typeOf(prop).includes("array") || typeOf(prop).includes("[]");

/** Elements of an array value: JSON ("[1, 2]") or comma separated ("1, 2"). */
function arrayItems(value: string): unknown[] {
  const text = value.trim();
  if (text === "") return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not JSON, read as a comma separated list
  }
  return text.replace(/^\[(.*)\]$/s, "$1").split(",");
}

/** Error for a value that does not fit the property type, or "". */
function typeError(prop: ProfileProperty, value: string): string {
  const type = typeOf(prop);
  if (INTEGER_TYPES.includes(type) && !/^[+-]?\d+$/.test(value.trim())) {
    return "Must be a whole number";
  }
  if (NUMBER_TYPES.includes(type) && !isNumeric(value)) {
    return "Must be a number";
  }
  if (type === "date" && Number.isNaN(Date.parse(value))) {
    return "Must be a date";
  }
  if (type === "boolean" && !/^(true|false)$/i.test(value.trim())) {
    return "Must be true or false";
  }
  if (type === "bit" && !/^[01]$/.test(value.trim())) {
    return "Must be 0 or 1";
  }
  return "";
}

/**
 * Value of one side of a constraint: "length(<property>)", a property, or a literal.
 * Undefined if it refers to a property that has no value yet.
 */
function operand(
  term: string,
  properties: ProfileProperty[],
  values: Record<string, string>,
  literal: boolean,
): { value: string; prop?: ProfileProperty } | undefined {
  const length = term.trim().match(/^length\((.*)\)$/);
  const name = length ? length[1] : term;
  const prop = properties.find((p) => same(p.name, name));
  if (!prop) {
    return literal && !length ? { value: term.trim() } : undefined;
  }
  const value = values[prop.name] ?? "";
  if (isBlank(value)) return undefined;
  return length
    ? { value: String(arrayItems(value).length) }
    : { value: value.trim(), prop };
}

function compare(a: number, op: string, b: number): boolean | undefined {
  switch (op) {
    case "==":
      return a === b;
    case "!=":
      return a !== b;
    case "<":
      return a < b;
    case ">":
      return a > b;
    case "<=":
      return a <= b;
    case ">=":
      return a >= b;
  }
  return undefined;
}

/** Error if `values` break the constraint, or "" (also when it cannot be checked yet). */
function constraintError(
  constraint: ProfileConstraint,
  properties: ProfileProperty[],
  values: Record<string, string>,
): string {
  const op = constraint.constraint?.trim();
  if (!op || isBlank(constraint.value)) return "";
  const left = operand(constraint.propertyName, properties, values, false);
  const right = operand(constraint.value, properties, values, true);
  if (!left || !right) return "";

  const message = `Must be ${op} ${constraint.value.trim()}`;
  const isDate = typeOf(left.prop) === "date" || typeOf(right.prop) === "date";
  if (isDate) {
    const a = Date.parse(left.value);
    const b = Date.parse(right.value);
    if (Number.isNaN(a) || Number.isNaN(b)) return "";
    return compare(a, op, b) === false ? message : "";
  }
  if (isNumeric(left.value) && isNumeric(right.value)) {
    return compare(Number(left.value), op, Number(right.value)) === false
      ? message
      : "";
  }
  // text: only equality can be checked
  if (op === "==") return left.value === right.value ? "" : message;
  if (op === "!=") return left.value !== right.value ? "" : message;
  return "";
}

/**
 * For every property, the first problem with its value ("" if none): missing although
 * required, not of its type, or a broken constraint. A constraint on "length(X)" counts
 * for X.
 */
export function propertyErrors(
  properties: ProfileProperty[],
  constraints: ProfileConstraint[],
  values: Record<string, string>,
): string[] {
  return properties.map((prop) => {
    const value = String(values[prop.name] ?? "");
    if (isBlank(value)) return prop.required ? "This field is required" : "";
    if (!isArrayType(prop)) {
      const error = typeError(prop, value);
      if (error) return error;
    }
    for (const c of constraints) {
      const target = c.propertyName?.trim().replace(/^length\((.*)\)$/, "$1");
      if (!same(target, prop.name)) continue;
      const error = constraintError(c, properties, values);
      if (error)
        return c.propertyName.trim().startsWith("length(")
          ? `Length ${error.charAt(0).toLowerCase()}${error.slice(1)}`
          : error;
    }
    return "";
  });
}
