import {
  Node,
} from "reactflow";

export const isUniqueIdentifier = (
  nodes: Node[],
  identifier: string,
  nodeId: string
): boolean => {
  console.log("check if outputIdentifier is unique");

  return !nodes.filter((node) => node.id !== nodeId).some(
    node => {
      console.log(nodeId); console.log(node.data.outputIdentifier);
      console.log(node.id)
      return node.data.outputIdentifier === identifier
    }
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

export function findDuplicateOutputIdentifier(nodes, currentNodeId, currentNode, identifier) {
  const identifierMap = new Map();

  nodes.forEach((node) => {
    const id = node.data?.outputs;
    for (const output of currentNode.data.outputs) {
      if (id && node.id !== currentNodeId && output?.identifier === identifier) {
        if (identifierMap.has(id)) {
          identifierMap.set(id, [...identifierMap.get(id), node.id]);
        } else {
          identifierMap.set(id, [node.id]);
        }
      }
    }

  });

  return identifierMap;
}
export function findDuplicateOutputIdentifiersInsideNode(nodes, currentNode, identifier) {
  const node = nodes.find(n => n.id === currentNode?.id);

  if (!currentNode || !currentNode.data?.outputs || currentNode.data.outputs.length <= 1) {
    return false;
  }

  const seen = new Set();

  for (const output of currentNode.data.outputs) {
    const id = output?.identifier;
    console.log(id)
    if (!id) continue;

    if (seen.has(id) && id === identifier) {
      return true;
    }
    seen.add(id);
  }

  return false;
}
