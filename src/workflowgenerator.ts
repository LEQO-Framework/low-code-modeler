import { create } from 'xmlbuilder2';
import JSZip from "jszip";
import $ from "jquery";

interface Node {
  id: string;
  type: string;
  data: { label: string, value: any; implementation: string; };
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

const OPENTOSCA_NAMESPACE_NODETYPE = "http://opentosca.org/nodetypes";
const QUANTME_NAMESPACE_PULL = "http://quantil.org/quantme/pull";

const topologyTemplateDefinition = `<Definitions targetNamespace="http://quantil.org/quantme/pull" id="winery-defs-for_pull-NodetypeToReplace" xmlns="http://docs.oasis-open.org/tosca/ns/2011/12" xmlns:yml="http://docs.oasis-open.org/tosca/ns/simple/yaml/1.3" xmlns:selfservice="http://www.eclipse.org/winery/model/selfservice" xmlns:winery="http://www.opentosca.org/winery/extensions/tosca/2013/02/12" xmlns:researchobject="http://www.eclipse.org/winery/model/researchobject" xmlns:testwineryopentoscaorg="http://test.winery.opentosca.org">
    <ServiceTemplate name="NodetypeToReplace" targetNamespace="http://quantil.org/quantme/pull" id="NodetypeToReplace">
        <TopologyTemplate>
            <NodeTemplate name="DockerEngine" minInstances="1" maxInstances="1" type="nodetypes:DockerEngine" id="DockerEngine_0" winery:x="779" winery:y="294" xmlns:nodetypes="http://opentosca.org/nodetypes">
                <Properties>
                    <otntyIproperties:DockerEngine_Properties xmlns:otntyIproperties="http://opentosca.org/nodetypes/properties">
                        <otntyIproperties:DockerEngineURL>tcp://dind:2375</otntyIproperties:DockerEngineURL>
                        <otntyIproperties:DockerEngineCertificate/>
                        <otntyIproperties:State>Running</otntyIproperties:State>
                    </otntyIproperties:DockerEngine_Properties>
                </Properties>
            </NodeTemplate>
            <NodeTemplate name="NodetypeToReplaceContainer" minInstances="1" maxInstances="1" type="nodetypes:NodetypeToReplaceContainer" id="NodetypeToReplaceContainer_0" winery:x="775" winery:y="102" xmlns:nodetypes="http://opentosca.org/nodetypes">
                <Properties>
                    <otntypdInodetypes:Properties xmlns:otntypdInodetypes="http://opentosca.org/nodetypes/propertiesdefinition/winery">
                        <otntypdInodetypes:Port/>
                        <otntypdInodetypes:ContainerPort>80</otntypdInodetypes:ContainerPort>
                        <otntypdInodetypes:ContainerID/>
                        <otntypdInodetypes:ContainerIP/>
                        <otntypdInodetypes:ENV_CAMUNDA_ENDPOINT>get_input: camundaEndpoint</otntypdInodetypes:ENV_CAMUNDA_ENDPOINT>
                        <otntypdInodetypes:ENV_CAMUNDA_TOPIC>get_input: camundaTopic</otntypdInodetypes:ENV_CAMUNDA_TOPIC>
                    </otntypdInodetypes:Properties>
                </Properties>
                <DeploymentArtifacts>
                    <DeploymentArtifact name="NodetypeToReplace_DA" artifactType="artifacttypes:DockerContainerArtifact" artifactRef="artifacttemplates:NodetypeToReplace_DA" xmlns:artifacttemplates="http://opentosca.org/artifacttemplates" xmlns:artifacttypes="http://opentosca.org/artifacttypes"/>
                </DeploymentArtifacts>
            </NodeTemplate>
            <RelationshipTemplate name="HostedOn" type="ToscaBaseTypes:HostedOn" id="con_HostedOn_0" xmlns:ToscaBaseTypes="http://docs.oasis-open.org/tosca/ns/2011/12/ToscaBaseTypes">
                <SourceElement ref="NodetypeToReplaceContainer_0"/>
                <TargetElement ref="DockerEngine_0"/>
            </RelationshipTemplate>
        </TopologyTemplate>
    </ServiceTemplate>
</Definitions>`;

const nodeTypeDefinition = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Definitions targetNamespace="http://opentosca.org/nodetypes" id="winery-defs-for_otntyIgeneral-NodetypeToReplace" xmlns="http://docs.oasis-open.org/tosca/ns/2011/12" xmlns:yml="http://docs.oasis-open.org/tosca/ns/simple/yaml/1.3" xmlns:selfservice="http://www.eclipse.org/winery/model/selfservice" xmlns:winery="http://www.opentosca.org/winery/extensions/tosca/2013/02/12" xmlns:researchobject="http://www.eclipse.org/winery/model/researchobject" xmlns:testwineryopentoscaorg="http://test.winery.opentosca.org">
    <NodeType name="NodetypeToReplaceContainer" abstract="no" final="no" targetNamespace="http://opentosca.org/nodetypes">
        <DerivedFrom typeRef="nodetypes:DockerContainer" xmlns:nodetypes="http://opentosca.org/nodetypes"/>
        <winery:PropertiesDefinition elementname="Properties" namespace="http://opentosca.org/nodetypes/propertiesdefinition/winery">
            <winery:properties>
                <winery:key>ContainerPort</winery:key>
                <winery:type>xsd:string</winery:type>
            </winery:properties>
            <winery:properties>
                <winery:key>Port</winery:key>
                <winery:type>xsd:string</winery:type>
            </winery:properties>
            <winery:properties>
                <winery:key>ENV_CAMUNDA_ENDPOINT</winery:key>
                <winery:type>xsd:string</winery:type>
            </winery:properties>
            <winery:properties>
                <winery:key>ENV_CAMUNDA_TOPIC</winery:key>
            </winery:properties>
        </winery:PropertiesDefinition>
    </NodeType>
</Definitions>`;

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
      ["xmlns:quantme"]: 'https://github.com/UST-QuAntiL/QuantME-Quantum4BPMN',
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

    const task = process.ele('quantme:quantumCircuitExecutionTask', {
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

    if (node.type === "optimizerNode") {
      task = process.ele('quantme:ParameterOptimizationTask', {
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

function generateScript(model: Model): string {
  const hasQuantum = model.nodes.some(n => isQuantumNode(n.type));
  const hasClassical = model.nodes.some(n => !isQuantumNode(n.type));

  const scriptLines: string[] = [];

  // Conditional imports
  if (hasClassical) {
    scriptLines.push("import math", "import cmath");
  }
  if (hasQuantum) {
    scriptLines.push(
      "import qiskit",
      "import qiskit.qasm3",
      "from qiskit_aer import AerSimulator",
      "from qiskit import transpile"
    );
  }

  scriptLines.push("");

  // Classical initialization
  if (hasClassical) {
    for (const node of model.nodes) {
      if (isQuantumNode(node.type)) continue;

      const name = node.data.label || `var_${node.id}`;
      const value = node.data.value;
      const type = node.type.toLowerCase();

      let line = "";

      switch (type) {
        case "classicalAlgorithmnode":
          line = node.data.implementation;
          break;
        case "int":
          line = `${name} = ${parseInt(value)}`;
          break;
        case "float":
          line = `${name} = ${parseFloat(value)}`;
          break;
        case "boolean":
          line = `${name} = ${value === true || value === "true"}`;
          break;
        case "array":
          line = `${name} = ${JSON.stringify(value)}`;
          break;
        case "bit":
          line = `${name} = ${value === "1" || value === 1 ? 1 : 0}`;
          break;
        case "complex":
          if (typeof value === "object" && value.real !== undefined && value.imag !== undefined) {
            line = `${name} = complex(${value.real}, ${value.imag})`;
          }
          break;
        case "angle":
          const radians = (parseFloat(value) * Math.PI) / 180;
          line = `${name} = ${radians}  # ${value} degrees`;
          break;
        default:
          line = `# Unsupported type '${type}' for ${name}`;
      }

      if (line) scriptLines.push(line);
    }

    scriptLines.push("\nprint('Classical variables initialized.')\n");
  }

  // Quantum group processing
  if (hasQuantum) {
    const getParent = (n: Node) => (n as any)?.parent || '__default__';

    const quantumGroups: Record<string, Node[]> = {};
    for (const node of model.nodes) {
      if (!isQuantumNode(node.type)) continue;
      const parent = getParent(node);
      if (!quantumGroups[parent]) quantumGroups[parent] = [];
      quantumGroups[parent].push(node);
    }

    let groupIndex = 0;
    for (const [groupId, nodes] of Object.entries(quantumGroups)) {
      groupIndex++;
      const circuitVar = `qc${groupIndex}`;
      scriptLines.push(`# Quantum Group: ${groupId}`);
      scriptLines.push(`${circuitVar}_program = \"\"\"`);

      for (const node of nodes) {
        if (node.data.implementation?.trim()) {
          scriptLines.push(node.data.implementation.trim());
        }
      }

      scriptLines.push(`\"\"\"`);
      scriptLines.push(`${circuitVar} = qiskit.qasm3.loads(${circuitVar}_program)`);
      scriptLines.push(`backend = AerSimulator()`);
      scriptLines.push(`bound_circuit = transpile(${circuitVar}, backend)`);
      scriptLines.push(`result = backend.run(bound_circuit).result()`);
      scriptLines.push(`counts = result.get_counts()`);
      scriptLines.push(`print("Results for Quantum Group ${groupId}:", counts)\n`);
    }
  }

  return scriptLines.join("\n");
}



const generateRequirements = (model: Model): string => {
  const hasQuantum = model.nodes.some(n => isQuantumNode(n.type));
  const hasClassical = model.nodes.some(n => !isQuantumNode(n.type));

  const classicalDeps = [
    "numpy==1.24.0",
  ];

  const quantumDeps = [
    "qiskit==2.1.1",
    "qiskit-aer==0.17.1",
    "qiskit-algorithms==0.3.1",
    "qiskit-qasm3-import==0.6.0",
  ];

  let requirements: string[] = [];

  if (hasClassical) {
    requirements = requirements.concat(classicalDeps);
  }
  if (hasQuantum) {
    requirements = requirements.concat(quantumDeps);
  }

  return requirements.join("\n");
};


const createAndSendZip = async (model: Model) => {
  const zip = new JSZip();

  const script = generateScript(model);
  const requirements = generateRequirements(model);

  zip.file("script.py", script);
  zip.file("requirements.txt", requirements);

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const fd = new FormData();
  fd.append("script", zipBlob, "required_programs.zip");

  try {
    //const scriptSplitterEndpoint = getScriptSplitterEndpoint();
    const result: any = await performAjax(
     `http://localhost:8891/qc-script-splitter/api/v1.0/split-implementation`,
     fd
    );
    //console.log("Result:", result);
    let programsBlob = result.programsBlob;
     let deploymentModels = await extractServiceZips(programsBlob);
    let qrmsActivities = [];
    for(let j = 0; j < model.nodes.length; j++){
    for (let i = 0; i < deploymentModels.length; i++) {
      let idwinery = model.nodes[i].id;
    let serviceTemplate = await createServiceTemplate(
        idwinery,
        QUANTME_NAMESPACE_PULL
      );
      console.log(serviceTemplate);
      const versionUrl =
        getWineryEndpoint() + "/servicetemplates/" + serviceTemplate;

      // create the deployment model containing the implementation
      let deploymentModelUrlResult = await createDeploymentModel(
        deploymentModels[i].serviceZipContent,
        getWineryEndpoint(),
        idwinery + "_DA",
        "http://opentosca.org/artifacttemplates",
        "{http://opentosca.org/artifacttypes}DockerContainerArtifact",
        "service",
        versionUrl
      );
      let deploymentModelUrl = deploymentModelUrlResult.deploymentModelUrl;

      // create the nodetype to add it to the created service template
      await createNodeType(
        idwinery + "Container",
        OPENTOSCA_NAMESPACE_NODETYPE
      );
      await updateNodeType(
        idwinery + "Container",
        OPENTOSCA_NAMESPACE_NODETYPE
      );
      serviceTemplate = await updateServiceTemplate(
        idwinery,
        QUANTME_NAMESPACE_PULL
      );
      console.log(serviceTemplate);
    }}
  } catch (error) {
    console.error("Upload failed:", error);
  }
};

function getWineryEndpoint() {
  return "http://localhost:8093";
}

export async function createServiceTemplate(name, namespace) {
  console.log("create service template with name ", name);
  const serviceTemplate = {
    localname: name,
    namespace: namespace,
  };
  const response = await fetch(getWineryEndpoint() + "/servicetemplates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify(serviceTemplate),
  });
  return response.text();
}


export async function createDeploymentModel(
  programBlobs,
  wineryEndpoint,
  localNamePrefix,
  artifactTemplateNamespace,
  artifactType,
  fileName,
  serviceTemplateURL
) {
  // create a new ArtifactTemplate and upload the agent file (the agent currently also contains the program and we deploy them together)
  let artifactName = await createNewArtifactTemplate(
    wineryEndpoint,
    localNamePrefix,
    artifactTemplateNamespace,
    artifactType,
    programBlobs,
    fileName
  );

  // create new ServiceTemplate for the hybrid program by adding a new version of the predefined template
  //let serviceTemplateURL = await createNewServiceTemplateVersion(
  // wineryEndpoint,
  //serviceTemplateName,
  //serviceTemplateNamespace
  //);
  //if (serviceTemplateURL.error !== undefined) {
  // return { error: serviceTemplateURL.error };
  //}

  // update DA reference within the created ServiceTemplate version
  let getTemplateXmlResult = await fetch(serviceTemplateURL + "xml");
  let getTemplateXmlResultJson = await getTemplateXmlResult.text();
  getTemplateXmlResultJson = getTemplateXmlResultJson.replace(
    ':QiskitRuntimeAgentContainer_DA"',
    ":" + artifactName + '"'
  );
  await fetch(serviceTemplateURL, {
    method: "PUT",
    body: getTemplateXmlResultJson,
    headers: { "Content-Type": "application/xml" },
  });

  // replace concrete Winery endpoint with abstract placeholder to enable QAA transfer into another environment
  let deploymentModelUrl = serviceTemplateURL.replace(
    wineryEndpoint,
    "{{ wineryEndpoint }}"
  );
  deploymentModelUrl += "?csar";
  return { deploymentModelUrl: deploymentModelUrl };
}

export async function createNewArtifactTemplate(
  wineryEndpoint,
  localNamePrefix,
  namespace,
  type,
  blob,
  fileName
) {
  console.log("Creating new ArtifactTemplate of type: ", type);

  // retrieve the currently available ArtifactTemplates
  const getArtifactsResult = await fetch(
    wineryEndpoint + "/artifacttemplates/"
  );
  const getArtifactsResultJson = await getArtifactsResult.json();

  console.log(getArtifactsResultJson);

  // get unique name for the ArtifactTemplate
  let artifactTemplateLocalName = localNamePrefix;
  if (
    getArtifactsResultJson.some(
      (e) => e.id === artifactTemplateLocalName && e.namespace === namespace
    )
  ) {
    let nameOccupied = true;
    artifactTemplateLocalName += "-" + makeId(1);
    while (nameOccupied) {
      if (
        !getArtifactsResultJson.some(
          (e) => e.id === artifactTemplateLocalName && e.namespace === namespace
        )
      ) {
        nameOccupied = false;
      } else {
        artifactTemplateLocalName += makeId(1);
      }
    }
  }
  console.log(
    "Creating ArtifactTemplate with name: ",
    artifactTemplateLocalName
  );

  // create ArtifactTemplate
  const artifactCreationResponse = await fetch(
    wineryEndpoint + "/artifacttemplates/",
    {
      method: "POST",
      body: JSON.stringify({
        localname: artifactTemplateLocalName,
        namespace,
        type,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  const artifactCreationResponseText = await artifactCreationResponse.text();

  // get URL for the file upload to the ArtifactTemplate
  const fileUrl =
    wineryEndpoint +
    "/artifacttemplates/" +
    artifactCreationResponseText +
    "files";

  // upload the blob
  const fd = new FormData();
  fd.append("file", blob, fileName);
  await performAjax(fileUrl, fd);

  return artifactTemplateLocalName;
}

export function makeId(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function createNodeType(name, namespace) {
  const nodetype = {
    localname: name,
    namespace: namespace,
  };
  const response = await fetch(`${getWineryEndpoint()}/nodetypes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify(nodetype),
  });
  return response.text();
}

export async function updateNodeType(name, namespace) {
  const nodetype = nodeTypeDefinition.replaceAll("NodetypeToReplace", name);
  console.log(
    getWineryEndpoint() +
      "/nodetypes/" +
      encodeURIComponent(encodeURIComponent(namespace)) +
      "/" +
      name
  );
  console.log(nodetype);
  const response = await fetch(
    `${getWineryEndpoint()}/nodetypes/${encodeURIComponent(
      encodeURIComponent(namespace)
    )}/${name}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/xml",
        Accept: "text/plain",
      },
      body: nodetype,
    }
  );
  return response.text();
}

export async function updateServiceTemplate(name, namespace) {
  const topologyTemplate = topologyTemplateDefinition.replaceAll(
    "NodetypeToReplace",
    name
  );
  console.log(
    getWineryEndpoint() +
      "/servicetemplates/" +
      encodeURIComponent(encodeURIComponent(namespace)) +
      "/" +
      name
  );
  console.log(topologyTemplate);
  const response = await fetch(
    `${getWineryEndpoint()}/servicetemplates/${encodeURIComponent(
      encodeURIComponent(namespace)
    )}/${name}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/xml",
        Accept: "text/plain",
      },
      body: topologyTemplate,
    }
  );
  return response.text();
}

export async function extractServiceZips(blob) {
  try {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(blob);
    const files = Object.keys(zip.files);

    const serviceZips = [];

    for (let filename of files) {
      console.log(filename);
      if (filename.endsWith(".zip")) {
        const serviceZipContent = await zip.file(filename).async("blob");
        serviceZips.push({ filename, serviceZipContent });
      }
    }

    if (serviceZips.length === 0) {
      throw new Error("No service.zip files found in the ZIP");
    }

    return serviceZips;
  } catch (error) {
    console.error("Error extracting service ZIPs:", error);
    throw error;
  }
}

export function performAjax(targetUrl, dataToSend) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "POST",
      url: targetUrl,
      data: dataToSend,
      processData: false,
      crossDomain: true,
      contentType: false,
      beforeSend: function () {},
      success: function (data) {
        resolve(data);
      },
      error: function (err) {
        reject(err);
      },
    });
  });
}