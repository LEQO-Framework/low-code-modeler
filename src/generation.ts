import { Mistral } from "@mistralai/mistralai";


type ChatContent =
    | string
    | { type: string; text?: string }[]
    | null
    | undefined;

function extractText(content: ChatContent): string {
    if (!content) return "";

    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
        return content
            .map((c) => (typeof c === "string" ? c : c.text ?? ""))
            .join("");
    }

    return "";
}

function safeJsonParse<T = any>(raw: string): T | null {
    try {
        const cleaned = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

export async function sendToMistral(prompt: string, token) {
    const mistral = new Mistral({ apiKey: token });
    const result = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
            {
                role: "system",
                content: `
You are a parser that extracts input variables for a computational flow.

Return ONLY valid JSON in this format:
{
  "inputs": [
    { "name": "inputName", "type": "string | number | boolean" }
  ]
}
                `,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    const raw = extractText(result.choices[0].message.content);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
        console.error("Invalid JSON from Mistral:", raw);
        return { inputs: [] };
    }

    return parsed;
}

export async function generateFlow(data: {
    prompt: string;
    inputs: Record<string, any>
}, token: string) {
    const mistral = new Mistral({ apiKey: token });
    const result = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
            {
                role: "system",
                content: `
You are a quantum workflow generator.

Return ONLY valid JSON representing a flow graph.

Example format:
{
  "nodes": [],
  "edges": []
}
                `,
            },
            {
                role: "user",
                content: `
Prompt: ${data.prompt}

Inputs:
${JSON.stringify(data.inputs, null, 2)}
                `,
            },
        ],
    });

    const raw = extractText(result.choices[0].message.content);
    const parsed = safeJsonParse(raw);

    if (!parsed) {
        console.error("Invalid JSON from Mistral:", raw);
        return null;
    }

    return parsed;
}
