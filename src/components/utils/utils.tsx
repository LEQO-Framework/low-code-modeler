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


export function findDuplicateOutputIdentifiers(nodes, currentNodeId) {
  const identifierMap = new Map();

  nodes.forEach((node) => {
    const id = node.data?.outputIdentifier;
    if (id && node.id !== currentNodeId) {
      if (identifierMap.has(id)) {
        identifierMap.set(id, [...identifierMap.get(id), node.id]);
      } else {
        identifierMap.set(id, [node.id]);
      }
    }
  });

  return identifierMap;
}