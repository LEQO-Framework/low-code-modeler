import { create } from 'xmlbuilder2';

interface Node {
  id: string;
  type: string;
  data: { label: string };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface Model {
  nodes: Node[];
  edges: Edge[];
}

function isQuantumNode(type: string): boolean {
  return ['gateNode', 'statePreparationNode', 'measurementNode', 'ancillaNode'].includes(type);
}

export function createBPMN(model: Model): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('bpmn:definitions', {
      ["xmlns:bpmn"]: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
      ["xmlns:bpmndi"]: 'http://www.omg.org/spec/BPMN/20100524/DI',
      ["xmlns:dc"]: 'http://www.omg.org/spec/DD/20100524/DC',
      ["xmlns:di"]: 'http://www.omg.org/spec/DD/20100524/DI',
      ["xmlns:xsi"]: 'http://www.w3.org/2001/XMLSchema-instance',
      ["xmlns:camunda"]: 'http://camunda.org/schema/1.0/bpmn',
      ["xmlns:opentosca"]: 'https://github.com/UST-QuAntiL/OpenTOSCA',
      ["id"]: 'Definitions_0wzkc0b',
      ["targetNamespace"]: 'http://bpmn.io/schema/bpmn',
      ["exporter"]: 'QuantME Modeler',
      ["exporterVersion"]: '4.5.0-nightly.20230126'
    });

  const process = doc.ele('bpmn:process', {
    id: 'Process_070m5p1',
    isExecutable: 'true'
  });

   const quantumGroups: Record<string, Node[]> = {};
  const classicalTasks: Node[] = [];

  const getParent = (n: Node) => (n as any)?.parent || '__default__';

  for (const node of model.nodes) {
    const parent = getParent(node);
    if (isQuantumNode(node.type)) {
      if (!quantumGroups[parent]) quantumGroups[parent] = [];
      quantumGroups[parent].push(node);
    } else {
      classicalTasks.push(node);
    }
  }

  const nodeToTaskId = new Map<string, string>();

  // Create quantum group tasks
  for (const [groupId, nodes] of Object.entries(quantumGroups)) {
    const taskId = `QuantumGroup_${groupId}`;
    nodeToTaskId.set(groupId, taskId);

    const task = process.ele('quantme:circuitExecutionTask', {
      id: taskId,
      name: `Quantum Task ${groupId}`
    });

    const quantumIds = new Set(nodes.map(n => n.id));

    for (const edge of model.edges) {
      const srcInGroup = quantumIds.has(edge.source);
      const tgtInGroup = quantumIds.has(edge.target);

      if (srcInGroup && !tgtInGroup) {
        task.ele('bpmn:outgoing').txt(`Flow_${edge.id}`);
      } else if (!srcInGroup && tgtInGroup) {
        task.ele('bpmn:incoming').txt(`Flow_${edge.id}`);
      }
      // else skip internal quantum edges
    }

    // Link node IDs to this merged task
    for (const n of nodes) nodeToTaskId.set(n.id, taskId);
  }

  // Classical tasks
  for (const node of classicalTasks) {
    const taskId = `Task_${node.id}`;
    nodeToTaskId.set(node.id, taskId);

    let task = process.ele('bpmn:serviceTask', {
      id: taskId,
      name: node.data.label
    });

    if(node.type === "optimizerNode"){
      task = process.ele('quantme:parameterOptimizationTask', {
      id: taskId,
      name: node.data.label
    });
    }
    const incoming = model.edges.filter(e => e.target === node.id);
    const outgoing = model.edges.filter(e => e.source === node.id);

    for (const inc of incoming) {
      task.ele('bpmn:incoming').txt(`Flow_${inc.id}`);
    }
    for (const out of outgoing) {
      task.ele('bpmn:outgoing').txt(`Flow_${out.id}`);
    }
  }

  // Now generate all sequence flows
  for (const edge of model.edges) {
    const sourceNode = model.nodes.find(n => n.id === edge.source);
    const targetNode = model.nodes.find(n => n.id === edge.target);

    const sourceQuantum = sourceNode && isQuantumNode(sourceNode.type);
    const targetQuantum = targetNode && isQuantumNode(targetNode.type);

    const sameQuantumGroup =
      sourceQuantum &&
      targetQuantum &&
      getParent(sourceNode!) === getParent(targetNode!);

    if (sameQuantumGroup) continue;

    const sourceRef = nodeToTaskId.get(edge.source) || `Task_${edge.source}`;
    const targetRef = nodeToTaskId.get(edge.target) || `Task_${edge.target}`;

    process.ele('bpmn:sequenceFlow', {
      id: `Flow_${edge.id}`,
      sourceRef,
      targetRef
    });
  }

  return doc.end({ prettyPrint: true });
}
