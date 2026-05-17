/**
 * Copyright (c) 2024 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import $ from "jquery";
const QUANTME_NAMESPACE_PUSH = "http://quantil.org/quantme/push";

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

export async function createArtifactTemplate(name, artifactTypeQName) {
  const artifactTemplate = {
    localname: name,
    namespace: QUANTME_NAMESPACE_PUSH + "/artifacttemplates",
    type: artifactTypeQName,
  };
  const response = await fetch(`http://localhost:8093/winery/artifacttemplates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify(artifactTemplate),
  });
  return response.text();
}

export async function addFileToArtifactTemplate(artifactTemplateAddress, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(
    `http://localhost:8093/winery/artifacttemplates/${artifactTemplateAddress}files`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "*/*",
      },
    }
  );
  return response.json();
}

export async function createArtifactTemplateWithFile(name, artifactType, file) {
  const artifactTemplateAddress = await createArtifactTemplate(
    name,
    artifactType
  );
  await addFileToArtifactTemplate(artifactTemplateAddress, file);
  return artifactTemplateAddress;
}

export async function createServiceTemplate(name, namespace) {
  console.log("create service template with name ", name);
  const serviceTemplate = {
    localname: name,
    namespace: namespace,
  };
  const response = await fetch("http://localhost:8093/winery" + "/servicetemplates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify(serviceTemplate),
  });
  return response.text();
}

export async function deleteArtifactTemplate(artifactTemplateName) {
  // /artifacttemplates/http%253A%252F%252Fquantil.org%252Fquantme%252Fpush%252Fartifacttemplates/ArtifactTemplate-Activity_01b3qkz/
  const response = await fetch(
    `http://localhost:8093/winery/artifacttemplates/${encodeURIComponent(
      encodeURIComponent(QUANTME_NAMESPACE_PUSH + "/")
    )}artifacttemplates/${encodeURIComponent(
      encodeURIComponent(artifactTemplateName)
    )}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return response.status === 204;
}

export async function serviceTemplateExists(serviceTemplateName) {
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${encodeURIComponent(
      encodeURIComponent(QUANTME_NAMESPACE_PUSH)
    )}/${encodeURIComponent(encodeURIComponent(serviceTemplateName))}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return response.status === 200;
}

export async function deleteTagByID(serviceTemplateAddress, tagID) {
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${serviceTemplateAddress}tags/${tagID}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return response.status === 204;
}

export async function getTags(serviceTemplateAddress) {
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${serviceTemplateAddress}tags/`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return response.json();
}

export async function deleteTopNodeTag(serviceTemplateAddress) {
  const tags = await getTags(serviceTemplateAddress);
  const topNodeTag = tags.find((tag) => tag.name === "top-node");
  if (topNodeTag) {
    return deleteTagByID(serviceTemplateAddress, topNodeTag.id);
  }
  return true;
}

export async function addNodeWithArtifactToServiceTemplateByName(
  serviceTemplateName,
  nodeTypeQName,
  name,
  artifactTemplateQName,
  artifactName,
  artifactTypeQName,
  requirementTypes,
  kvProperties
) {
  const serviceTemplateAddress =
    encodeURIComponent(encodeURIComponent(QUANTME_NAMESPACE_PUSH)) +
    "/" +
    encodeURIComponent(encodeURIComponent(serviceTemplateName)) +
    "/";
  await addNodeWithArtifactToServiceTemplate(
    serviceTemplateAddress,
    nodeTypeQName,
    name,
    artifactTemplateQName,
    artifactName,
    artifactTypeQName,
    requirementTypes,
    kvProperties
  );
  return serviceTemplateAddress;
}

export async function addNodeToServiceTemplate(
  serviceTemplateAddress,
  nodeTypeQName,
  name
) {
  const nodeTemplate = {
    documentation: [],
    any: [],
    otherAttributes: {},
    relationshipTemplates: [],
    nodeTemplates: [
      {
        documentation: [],
        any: [],
        otherAttributes: {
          "{http://www.opentosca.org/winery/extensions/tosca/2013/02/12}x": 1245,
          "{http://www.opentosca.org/winery/extensions/tosca/2013/02/12}y": 350,
        },
        properties: {
          propertyType: "KV",
          kvproperties: {
            Port: "",
            Name: "",
          },
          elementName: "properties",
          namespace:
            "http://opentosca.org/nodetypes/propertiesdefinition/winery",
        },
        id: nodeTypeQName.split(/}(.*)/s)[1],
        type: nodeTypeQName,
        name: name,
        minInstances: 1,
        maxInstances: 1,
        x: 1245,
        y: 350,
        capabilities: [],
        requirements: [],
        deploymentArtifacts: null,
        policies: null,
      },
    ],
  };
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${serviceTemplateAddress}topologytemplate`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(nodeTemplate),
    }
  );
  return response.status === 204;
}

export async function addNodeWithArtifactToServiceTemplate(
  serviceTemplateAddress,
  nodeTypeQName,
  name,
  artifactTemplateQName,
  artifactName,
  artifactTypeQName,
  requirementTypes,
  kvProperties
) {
  const nodeTemplate = {
    documentation: [],
    any: [],
    otherAttributes: {},
    relationshipTemplates: [],
    nodeTemplates: [
      {
        documentation: [],
        any: [],
        otherAttributes: {
          "{http://www.opentosca.org/winery/extensions/tosca/2013/02/12}x": 1245,
          "{http://www.opentosca.org/winery/extensions/tosca/2013/02/12}y": 350,
        },
        properties: {
          propertyType: "KV",
          kvproperties: kvProperties,
          elementName: "properties",
          namespace:
            "http://opentosca.org/nodetypes/propertiesdefinition/winery",
        },
        id: nodeTypeQName.split(/}(.*)/s)[1],
        type: nodeTypeQName,
        name: name,
        minInstances: 1,
        maxInstances: 1,
        x: 1245,
        y: 350,
        capabilities: [],
        requirements: requirementTypes,
        deploymentArtifacts: [
          {
            documentation: [],
            any: [],
            otherAttributes: {},
            name: artifactName,
            artifactType: artifactTypeQName,
            artifactRef: artifactTemplateQName,
          },
        ],
        policies: null,
      },
    ],
  };
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${serviceTemplateAddress}topologytemplate`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(nodeTemplate),
    }
  );
  return response.status === 204;
}

export async function getServiceTemplateXML(serviceTemplateAddress) {
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${serviceTemplateAddress}xml`,
    {
      method: "GET",
      headers: {
        Accept: "application/xml",
      },
    }
  );
  return response.json();
}

export async function insertTopNodeTag(serviceTemplateAddress, nodeTypeQName) {
  const tag = {
    name: "top-node",
    value: nodeTypeQName.split(/}(.*)/s)[1],
  };
  const response = await fetch(
    "http://localhost:8093/winery" +
      "/servicetemplates/" +
      serviceTemplateAddress +
      "tags/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify(tag),
    }
  );
  return response.text();
}

export async function createServiceTemplateWithNodeAndArtifact(
  name,
  nodeTypeQName,
  nodeName,
  artifactTemplateQName,
  artifactName,
  artifactTypeQName,
  requirementTypes,
  kvProperties
) {
  const serviceTemplateAddress = await createServiceTemplate(
    name,
    "http://quantil.org/quantme/push"
  );
  await addNodeWithArtifactToServiceTemplate(
    serviceTemplateAddress,
    nodeTypeQName,
    nodeName,
    artifactTemplateQName,
    artifactName,
    artifactTypeQName,
    requirementTypes,
    kvProperties
  );
  return serviceTemplateAddress;
}

export async function getArtifactTemplateInfo(artifactTemplateAddress) {
  const response = await fetch(
    `http://localhost:8093/winery/artifacttemplates/${artifactTemplateAddress}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return response.json();
}

const nodeTypeQNameMapping = new Map([
  [
    "{http://opentosca.org/artifacttypes}WAR",
    "{http://opentosca.org/nodetypes}TomcatApplication_WAR-w1",
  ],
  [
    "{http://opentosca.org/artifacttypes}WAR-Java17",
    "{http://opentosca.org/nodetypes}TomcatApplication_WAR-w1",
  ],
  [
    "{http://opentosca.org/artifacttypes}WAR-Java8",
    "{http://opentosca.org/nodetypes}TomcatApplication_WAR-w1",
  ],
  [
    "{http://opentosca.org/artifacttypes}PythonArchiveArtifact",
    "{http://opentosca.org/nodetypes}PythonApp_3-w1",
  ],
]);

const artifactTypeKVMapping = new Map([
  [
    "WAR",
    {
      Port: "",
      Name: "",
    },
  ],
  [
    "Python",
    {
      Port: "",
      Name: "",
    },
  ],
  [
    "Flask",
    {
      StartupCommand:
        "export FLASK_APP=app.py && export FLASK_ENV=development && export FLASK_DEBUG=0 && python3 -m flask run --host=0.0.0.0",
      Name: "app",
    },
  ],
]);

export function getNodeTypeQName(artifactTypeQName) {
  return nodeTypeQNameMapping.get(artifactTypeQName);
}

export function getArtifactTypeKVMapping(artifactType) {
  console.log("retrieving kv mapping for type", artifactType);
  return artifactTypeKVMapping.get(artifactType);
}

export async function loadTopology(deploymentModelUrl) {
  if (deploymentModelUrl.startsWith("{{ wineryEndpoint }}")) {
    deploymentModelUrl = deploymentModelUrl.replace(
      "{{ wineryEndpoint }}",
      "http://localhost:8093/winery"
    );
  }
  let topology;
  let tags;
  try {
    topology = await fetch(
      deploymentModelUrl.replace("?csar", "topologytemplate"),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    ).then((res) => res.json());
    tags = await fetch(deploymentModelUrl.replace("?csar", "tags")).then(
      (res) => res.json()
    );
  } catch (e) {
    throw new Error(
      "An unexpected error occurred during loading the deployments models topology."
    );
  }
  let topNode;
  const topNodeTag = tags.find((tag) => tag.name === "top-node");
  if (topNodeTag) {
    const topNodeId = topNodeTag.value;
    topNode = topology.nodeTemplates.find(
      (nodeTemplate) => nodeTemplate.id === topNodeId
    );
    if (!topNode) {
      throw new Error(`Top level node "${topNodeId}" not found.`);
    }
  } else {
    let nodes = new Map(
      topology.nodeTemplates.map((nodeTemplate) => [
        nodeTemplate.id,
        nodeTemplate,
      ])
    );
    for (let relationship of topology.relationshipTemplates) {
      if (relationship.name === "HostedOn") {
        nodes.delete(relationship.targetElement.ref);
      }
    }
    if (nodes.size === 1) {
      topNode = nodes.values().next().value;
    }
  }
  if (!topNode) {
    throw new Error("No top level node found.");
  }

  return {
    topNode,
    nodeTemplates: topology.nodeTemplates,
    relationshipTemplates: topology.relationshipTemplates,
  };
}

/**
 * Generate a deployment model to deploy the generated hybrid program and the corresponding agent
 *
 * @param programBlobs the blobs containing the data for the hybrid program and agent
 * @param wineryEndpoint endpoint of the Winery instance to create the deployment model
 * @return the URL of the generated deployment model, or an error if the generation failed
 */
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

export async function createNodeType(name, namespace) {
  const nodetype = {
    localname: name,
    namespace: namespace,
  };
  const response = await fetch(`http://localhost:8093/winery/nodetypes`, {
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
    "http://localhost:8093/winery" +
      "/nodetypes/" +
      encodeURIComponent(encodeURIComponent(namespace)) +
      "/" +
      name
  );
  console.log(nodetype);
  const response = await fetch(
    `http://localhost:8093/winery/nodetypes/${encodeURIComponent(
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
    "http://localhost:8093/winery" +
      "/servicetemplates/" +
      encodeURIComponent(encodeURIComponent(namespace)) +
      "/" +
      name
  );
  console.log(topologyTemplate);
  const response = await fetch(
    `http://localhost:8093/winery/servicetemplates/${encodeURIComponent(
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

/**
 * Upload the CSAR located at the given URL to the connected OpenTOSCA Container and return the corresponding URL and required input parameters
 *
 * @param opentoscaEndpoint the endpoint of the OpenTOSCA Container
 * @param csarName the name of the CSAR to upload
 * @param url the URL pointing to the CSAR
 * @param wineryEndpoint the endpoint of the Winery containing the CSAR to upload
 */
export async function uploadCSARToContainer(
  opentoscaEndpoint,
  csarName,
  url,
  wineryEndpoint
) {
  if (opentoscaEndpoint === undefined) {
    console.error("OpenTOSCA endpoint is undefined. Unable to upload CSARs...");
    return { success: false };
  }

  try {
    if (url.startsWith("{{ wineryEndpoint }}")) {
      url = url.replace("{{ wineryEndpoint }}", wineryEndpoint);
    }
    console.log(
      "Checking if CSAR at following URL is already uploaded to the OpenTOSCA Container: ",
      url
    );

    // check if CSAR is already uploaded
    let getCSARResult:any = await getBuildPlanForCSAR(opentoscaEndpoint, csarName);

    if (!getCSARResult.success) {
      console.log("CSAR is not yet uploaded. Uploading...");

      const body = {
        enrich: "false",
        name: csarName,
        url,
      };

      // upload the CSAR
      await fetch(opentoscaEndpoint, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      console.log(
        "CSAR sent to OpenTOSCA Container. Waiting for build plan..."
      );

      // check successful upload and retrieve corresponding url
      getCSARResult = await getBuildPlanForCSAR(opentoscaEndpoint, csarName);
      console.log("Retrieved result: ", getCSARResult);
    }

    if (!getCSARResult.success) {
      console.error("Uploading CSAR failed!");
      return { success: false };
    }

    // retrieve input parameters for the build plan
    const buildPlanResult = await fetch(getCSARResult.url);
    const buildPlanResultJson = await buildPlanResult.json();

    return {
      success: true,
      url: getCSARResult.url,
      inputParameters: buildPlanResultJson.input_parameters,
    };
  } catch (e) {
    console.error("Error while uploading CSAR: " + e);
    return { success: false };
  }
}

/**
 * Get the link to the build plan of the CSAR with the given name if it is uploaded to the OpenTOSCA Container
 *
 * @param opentoscaEndpoint the endpoint of the OpenTOSCA Container
 * @param csarName the name of the csar
 * @return the status whether the given CSAR is uploaded and the corresponding build plan link if available
 */
async function getBuildPlanForCSAR(opentoscaEndpoint, csarName) {
  console.log("Retrieving build plan for CSAR with name: ", csarName);

  // get all currently deployed CSARs
  const response = await fetch(opentoscaEndpoint);
  const responseJson = await response.json();

  const deployedCSARs = responseJson.csars;
  if (deployedCSARs === undefined) {
    // no CSARs available
    return { success: false };
  }
  console.log("Retrieved all currently deployed CSARs: ", deployedCSARs);

  for (let i = 0; i < deployedCSARs.length; i++) {
    const deployedCSAR = deployedCSARs[i];
    if (deployedCSAR.id === csarName) {
      console.log("Found uploaded CSAR with id: %s", csarName);
      const url = deployedCSAR._links.self.href;

      // retrieve the URl to the build plan required to get the input parameters and to instantiate the CSAR
      return getBuildPlanUrl(url);
    }
  }

  // unable to find CSAR
  return { success: false };
}

/**
 * Get the URL to the build plan of the given CSAR
 *
 * @param csarUrl the URL to a CSAR
 * @return the URL to the build plan for the given CSAR
 */
async function getBuildPlanUrl(csarUrl) {
  let response = await fetch(csarUrl + "/servicetemplates");
  let responseJson = await response.json();

  if (
    !responseJson.service_templates ||
    responseJson.service_templates.length !== 1
  ) {
    console.error(
      "Unable to find service template in CSAR at URL: %s",
      csarUrl
    );
    return { success: false };
  }

  const buildPlansUrl =
    responseJson.service_templates[0]._links.self.href + "/buildplans";
  response = await fetch(buildPlansUrl);
  responseJson = await response.json();

  if (!responseJson.plans || responseJson.plans.length !== 1) {
    console.error("Unable to find build plan at URL: %s", buildPlansUrl);
    return { success: false };
  }

  return { success: true, url: responseJson.plans[0]._links.self.href };
}

/**
 * Create an instance of the ServiceTemplate contained in the given CSAR
 *
 * @param csar the details about the CSAR to create an instance from the contained ServiceTemplate
 * @param camundaEngineEndpoint the endpoint of the Camunda engine to bind services using the pulling pattern
 * @param qprovEndpoint the endpoint of QProv to store provenance data
 * @param inputParams a set of predfined input parameters to use for the instance creation
 * @return the result of the instance creation (success, endpoint, topic on which the service listens, ...)
 */
export async function createServiceInstance(
  csar,
  camundaEngineEndpoint,
  qprovEndpoint,
  inputParams
) {
  const result:any = { success: false };

  const inputParameters = csar.inputParameters;
  console.log("Required input parameters: ", inputParameters);
  if (csar.type === "pull") {
    // get special parameters that are required to bind services using external tasks / the pulling pattern
    const camundaTopicParam = inputParameters.find(
      (param) => param.name === "camundaTopic"
    );
    const camundaEndpointParam = inputParameters.find(
      (param) => param.name === "camundaEndpoint"
    );

    // abort if parameters are not available
    if (camundaTopicParam === undefined || camundaEndpointParam === undefined) {
      console.error(
        "Unable to pass topic to poll to service instance creation. Service binding will fail!"
      );
      return result;
    }

    // generate topic for the binding
    const topicName = makeId(12);

    camundaTopicParam.value = topicName;
    camundaEndpointParam.value = camundaEngineEndpoint;
    result.topicName = topicName;
  }

  // add QProv endpoint for provenance data storage
  const qprovEndpointParam = inputParameters.find(
    (param) => param.name === "QProvEndpoint"
  );
  if (qprovEndpointParam !== undefined) {
    console.info(
      "ServiceTemplate requires QProv Endpoint as input: ",
      qprovEndpoint
    );
    qprovEndpointParam.value = qprovEndpoint;
  }

  // handle input parameters for completed ServiceTemplates
  inputParameters.forEach((param) => {
    if (!param.value) {
      console.log("Parameter is not yet defined: ", param.name);
      param.value = inputParams[param.name];
    }
  });
  console.log("Input parameters after adding provided data: ", inputParameters);

  // trigger instance creation
  const instanceCreationResponse = await fetch(
    csar.buildPlanUrl + "/instances",
    {
      method: "POST",
      body: JSON.stringify(inputParameters),
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
    }
  );
  console.log("Received instance creation response");
  console.log(instanceCreationResponse);
  const instanceCreationResponseJson = await instanceCreationResponse.text();

  console.log(instanceCreationResponseJson);
  // wait for the service instance to be created
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("Getting service template instance");
  // get service template instance to poll for completness
  let buildPlanResponse = await fetch(
    csar.buildPlanUrl + "/instances/" + instanceCreationResponseJson
  );
  console.log("Received service template instance");
  let buildPlanResponseJson = await buildPlanResponse.json();

  // retry polling 10 times, creation of the build time takes some time
  for (let retry = 0; retry < 10; retry++) {
    // stop retries in case of correct response
    if (buildPlanResponseJson._links) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("Retry fetching build plan");

    buildPlanResponse = await fetch(
      csar.buildPlanUrl + "/instances/" + instanceCreationResponseJson
    );
    buildPlanResponseJson = await buildPlanResponse.json();
  }

  if (!buildPlanResponseJson._links) {
    console.log(
      "Unable to fetch build plans for " +
        csar.buildPlanUrl +
        "/instances/" +
        instanceCreationResponseJson
    );
    result.success = false;
    return result;
  }

  const pollingUrl =
    buildPlanResponseJson._links.service_template_instance.href;

  let state = "CREATING";
  console.log("Polling for finished service instance at URL: %s", pollingUrl);
  let properties = "";
  while (!(state === "CREATED" || state === "FAILED")) {
    // wait 5 seconds for next poll
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // poll for current state
    const pollingResponse = await fetch(pollingUrl);
    const pollingResponseJson = await pollingResponse.json();
    console.log("Polling response: ", pollingResponseJson);
    properties = pollingResponseJson._links.properties.href;

    state = pollingResponseJson.state;
  }

  result.success = true;
  result.properties = properties;
  result.buildPlanUrl =
    csar.buildPlanUrl + "/instances/" + instanceCreationResponseJson;
  return result;
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

/**
 * Create a new ArtifactTemplate of the given type and add the given blob as file
 *
 * @param wineryEndpoint the endpoint of the Winery to create the ArtifactTemplate at
 * @param localNamePrefix the prefix of the local name of the artifact to which a random suffix is added if an ArtifactTemplate with the name already exists
 * @param namespace the namespace of the ArtifactTemplate to create
 * @param type the type of the ArtifactTemplate to create
 * @param blob the blob to upload to the ArtifactTemplate
 * @param fileName the name of the file to upload as blob
 * @return the final name of the created ArtifactTemplate
 */
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

/**
 * Create a new version of the ServiceTemplate with the given ID and namespace and return its URL or an error if the ServiceTemplate does not exist
 *
 * @param wineryEndpoint the endpoint of the Winery to create the new ServiceTemplate version
 * @param serviceTemplateId the ID of the ServiceTemplate to create a new version from
 * @param serviceTemplateNamespace the namespace of the ServiceTemplate to create a new version from
 * @return the URL to the new version, or an error if the base ServiceTemplate is not available at the given Winery endpoint
 */
export async function createNewServiceTemplateVersion(
  wineryEndpoint,
  serviceTemplateId,
  serviceTemplateNamespace
) {
  console.log(
    "Creating new version of Service Template with ID %s and namespace %s",
    serviceTemplateId,
    serviceTemplateNamespace
  );

  // retrieve the currently available ServiceTemplates
  const getTemplatesResult = await fetch(wineryEndpoint + "/servicetemplates/");
  const getTemplatesResultJson = await getTemplatesResult.json();

  // abort if base service template is not available
  if (
    !getTemplatesResultJson.some(
      (e) =>
        e.id === serviceTemplateId && e.namespace === serviceTemplateNamespace
    )
  ) {
    console.log(
      "Required base ServiceTemplate for deploying Qiskit Runtime programs not available in Winery!"
    );
    return {
      error:
        "Required base ServiceTemplate for deploying Qiskit Runtime programs not available in Winery!",
    };
  }

  // get unique name for the new version
  let version = makeId(5);
  let nameOccupied = true;
  while (nameOccupied) {
    if (
      !getTemplatesResultJson.some(
        (e) =>
          e.id === serviceTemplateId + "_" + version + "-w1-wip1" &&
          e.namespace === serviceTemplateNamespace
      )
    ) {
      nameOccupied = false;
    } else {
      version += makeId(1);
    }
  }
  console.log("Using component version: ", version);

  // create ServiceTemplate version
  const versionUrl =
    wineryEndpoint +
    "/servicetemplates/" +
    encodeURIComponent(encodeURIComponent(serviceTemplateNamespace)) +
    "/" +
    serviceTemplateId;
  console.log("Creating new version under URL:", versionUrl);
  const versionCreationResponse = await fetch(versionUrl, {
    method: "POST",
    body: JSON.stringify({
      version: {
        componentVersion: version,
        currentVersion: false,
        editable: true,
        latestVersion: false,
        releasable: false,
        wineryVersion: 1,
        workInProgressVersion: 1,
      },
    }),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });

  // assemble URL to the created ServiceTemplate version
  const versionCreationResponseText = await versionCreationResponse.text();
  return wineryEndpoint + "/servicetemplates/" + versionCreationResponseText;
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