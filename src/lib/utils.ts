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

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    const newNode = {
      id: getId(),
      type,
      position,
      data: { label: label, inputs: [], implementation: "", implementationType: "", uncomputeImplementationType: "", uncomputeImplementation: ""}
    };

    setNodes(newNode);
  }
}
