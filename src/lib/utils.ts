import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let id = 0;
const getId = () => crypto.randomUUID();

export function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

export function isPointInBox(
  point: { x: number; y: number },
  box: { x: number; y: number; width: number; height: number }
) {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

export async function handleOnDrop(
  event: React.DragEvent<HTMLDivElement>,
  reactFlowWrapper: any,
  reactFlowInstance: any,
  setNodes: any,
) {
  event.preventDefault();
  if (reactFlowWrapper) {
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData("application/reactflow");
    const dataType = event.dataTransfer.getData("application/reactflow/dataType");
    const label = event.dataTransfer.getData("application/reactflow/label");
    const pluginDataStr = event.dataTransfer.getData("application/reactflow/pluginData");

    console.log('[handleOnDrop] type:', type);
    console.log('[handleOnDrop] dataType:', dataType);
    console.log('[handleOnDrop] label:', label);
    console.log('[handleOnDrop] pluginDataStr:', pluginDataStr);

    // check if the dropped element is valid
    if (typeof type === "undefined" || !type) {
      return;
    }

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    // For plugin nodes, create node with plugin data
    if (type === "pluginNode" && pluginDataStr) {
      try {
        const pluginData = JSON.parse(pluginDataStr);
        console.log('[handleOnDrop] Parsed plugin data:', pluginData);

        // Try to fetch full plugin metadata from API, but fallback to mock data if it fails
        let dataInputs: any[] = pluginData.mockDataInputs || [];
        let dataOutputs: any[] = pluginData.mockDataOutputs || [];

        try {
          const metadataResponse = await fetch(pluginData.apiRoot);
          if (metadataResponse.ok) {
            const fullMetadata = await metadataResponse.json();
            console.log('[handleOnDrop] Full plugin metadata from API:', fullMetadata);
            dataInputs = fullMetadata.entry_point?.data_input || dataInputs;
            dataOutputs = fullMetadata.entry_point?.data_output || dataOutputs;
          } else {
            console.warn('[handleOnDrop] Plugin metadata endpoint not available, using mock data');
          }
        } catch (fetchError) {
          console.warn('[handleOnDrop] Failed to fetch detailed metadata, using mock data:', fetchError);
        }

        console.log('[handleOnDrop] Using inputs:', dataInputs);
        console.log('[handleOnDrop] Using outputs:', dataOutputs);

        const newNode = {
          id: getId(),
          type,
          position,
          data: {
            label: pluginData.name,
            pluginIdentifier: pluginData.identifier,
            pluginName: pluginData.name,
            pluginDescription: pluginData.description,
            pluginApiRoot: pluginData.apiRoot,
            tags: pluginData.tags || [],
            dataInputs,
            dataOutputs,
            inputs: [],
            children: [],
            implementation: "",
            implementationType: "",
            uncomputeImplementationType: "",
            uncomputeImplementation: ""
          }
        };

        console.log('[handleOnDrop] Created plugin node:', newNode);
        setNodes(newNode);
      } catch (error) {
        console.error('[handleOnDrop] Error creating plugin node:', error);
      }
    } else {
      // Standard node creation for non-plugin nodes
      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          label: label,
          inputs: [],
          children: [],
          implementation: "",
          implementationType: "",
          uncomputeImplementationType: "",
          uncomputeImplementation: ""
        }
      };

      setNodes(newNode);
    }
  }
}
