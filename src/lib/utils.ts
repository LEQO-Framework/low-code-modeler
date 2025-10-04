import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { categories } from "@/components/panels/categories";

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

export function handleOnDrop(
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
    console.log(type)
    console.log(dataType)

    //let position2 = reactFlowInstance.screenToFlowPosition();

    //console.log(position2)


    // check if the dropped element is valid
    if (typeof type === "undefined" || !type) {
      return;
    }
    const def = findNodeDefinition(type, label);
    console.log(def)

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const newNode = {
      id: getId(),
      type,
      position,
      data: { label: label, inputs: [], children: [], implementation: "", implementationType: "", uncomputeImplementationType: "", uncomputeImplementation: "", completionGuaranteed: def?.completionGuaranteed ?? false }
    };

    setNodes(newNode);
  }
}

function findNodeDefinition(type: string, label: string) {
  for (const cat of Object.values(categories)) {
    const content = cat.content;

    if (Array.isArray(content)) {
      const match = content.find(n => n.type === type && n.label === label);
      if (match) return match;
    } else {
      for (const sub of Object.values(content)) {
        if (Array.isArray(sub)) {
          const match = sub.find(n => n.type === type && n.label === label);
          if (match) return match;
        } else {
          for (const subsub of Object.values(sub)) {
            if (Array.isArray(subsub)) {
              const match = subsub.find(n => n.type === type && n.label === label);
              if (match) return match;
            }
          }
        }
      }
    }
  }
  return undefined;
}