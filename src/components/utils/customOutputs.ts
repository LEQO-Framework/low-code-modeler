export type CustomOutputType = "quantum" | "classical";

export type CustomOutput = {
  identifier: string;
  size: string;
  type: CustomOutputType;
  [key: string]: any;
};

const isCustomOutputType = (value: any): value is CustomOutputType =>
  value === "quantum" || value === "classical";

export function normalizeCustomOutputs(
  outputs: any[] | undefined,
  numberQuantumOutputs: number,
  numberClassicalOutputs: number,
): CustomOutput[] {
  const totalOutputs = numberQuantumOutputs + numberClassicalOutputs;
  const source = Array.isArray(outputs) ? outputs : [];
  const normalized: CustomOutput[] = [];
  let remainingQuantum = numberQuantumOutputs;
  let remainingClassical = numberClassicalOutputs;

  source.slice(0, totalOutputs).forEach((output: any, index: number) => {
    const existingType = output?.type;
    let type: CustomOutputType;

    if (
      existingType === "quantum" &&
      remainingQuantum > 0
    ) {
      type = "quantum";
      remainingQuantum--;
    } else if (
      existingType === "classical" &&
      remainingClassical > 0
    ) {
      type = "classical";
      remainingClassical--;
    } else if (index < numberClassicalOutputs && remainingClassical > 0) {
      type = "classical";
      remainingClassical--;
    } else if (remainingQuantum > 0) {
      type = "quantum";
      remainingQuantum--;
    } else {
      type = "classical";
      remainingClassical--;
    }

    normalized.push({
      ...(output || {}),
      identifier: output?.identifier || "",
      size: output?.size || "",
      type,
    });
  });

  while (normalized.length < totalOutputs) {
    const type: CustomOutputType =
      remainingClassical > 0 ? "classical" : "quantum";
    if (type === "classical") remainingClassical--;
    else remainingQuantum--;

    normalized.push({ identifier: "", size: "", type });
  }

  return normalized;
}

export function hasCanonicalCustomOutputs(
  outputs: any[] | undefined,
  numberQuantumOutputs: number,
  numberClassicalOutputs: number,
): outputs is CustomOutput[] {
  const totalOutputs = numberQuantumOutputs + numberClassicalOutputs;
  const quantumOutputs = outputs?.filter(
    (output) => output?.type === "quantum",
  ).length;
  const classicalOutputs = outputs?.filter(
    (output) => output?.type === "classical",
  ).length;
  return (
    Array.isArray(outputs) &&
    outputs.length === totalOutputs &&
    quantumOutputs === numberQuantumOutputs &&
    classicalOutputs === numberClassicalOutputs &&
    outputs.every(
      (output) =>
        output &&
        isCustomOutputType(output.type) &&
        typeof output.identifier === "string" &&
        typeof output.size === "string",
    )
  );
}
