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

        // Determine display name
        let displayName = pluginData.name;
        if (pluginData.name === 'classical-k-means') {
          displayName = 'Classical Clustering';
        } else if (pluginData.name === 'quantum-k-means') {
          displayName = 'Quantum Clustering';
        }

        // Try to fetch full plugin metadata from API, but fallback to mock data if it fails
        let dataInputs: any[] = pluginData.mockDataInputs || [];
        let dataOutputs: any[] = pluginData.mockDataOutputs || [];

        try {
          const metadataResponse = await fetch(pluginData.apiRoot);
          if (metadataResponse.ok) {
            const fullMetadata = await metadataResponse.json();
            dataInputs = fullMetadata.entry_point?.data_input || dataInputs;
            dataOutputs = fullMetadata.entry_point?.data_output || dataOutputs;
          }
        } catch (fetchError) {
          // Fallback to mock data if API fetch fails
        }

        const newNode = {
          id: getId(),
          type,
          position,
          data: {
            label: displayName,
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
            uncomputeImplementation: "",
            // Set default clustering algorithm for k-means nodes
            clusteringAlgorithm: (pluginData.name === 'classical-k-means' || pluginData.name === 'quantum-k-means') ? 'k-means' : undefined
          }
        };

        setNodes(newNode);
      } catch (error) {
        console.error('Error creating plugin node:', error);
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
