import  {
  Node,
} from "reactflow";

export const isUniqueIdentifier = (
  nodes: Node[],
  identifier: string,
  nodeId: string
): boolean => {
  console.log("check if outputIdentifier is unique");

  return !nodes.filter((node)=> node.id !== nodeId).some(
    node =>{console.log(nodeId); console.log(node.data.outputIdentifier);
      console.log(node.id)
      return node.data.outputIdentifier === identifier}
  );
};
