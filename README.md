# Low Code Modeler

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A low code modeler which allows to model quantum algorithms.

## Requirements

- Node.js 22.x+
- pnpm
- Docker & Docker Compose

## Quick Start

Make sure to start:

1. **leqo-backend**: `cd leqo-backend && docker compose -f compose-dev.yaml up -d` (runs on port 8000)
2. **Low Code Modeler**: `pnpm install && npm run dev` (runs on port 4242)
3. **Configure**: Create `.env` with `VITE_LOW_CODE_BACKEND=http://localhost:8000`
4. **Open**: http://localhost:4242

## Usage

### Creating a Workflow

1. Open the application at http://localhost:4242
2. Use the node palette on the left to drag nodes onto the canvas
3. Connect nodes by dragging from output handles to input handles
4. Configure node parameters by clicking on them

### Available Node Types

- **Qubit Nodes**: Create qubit registers
- **Literal Nodes**: Integer, Float, Bit, Bool, Array literals
- **Gate Nodes**: Quantum gates (H, X, Y, Z, CNOT, etc.)
- **Control Structures**: If statements, loops
- **Plugin Nodes**: External services like ML algorithms

### Compiling to OpenQASM

1. Create your workflow using the visual editor
2. Click the "Compile" button in the toolbar
3. The compiled OpenQASM code will be displayed

## ML Workflows with Plugin Nodes

The Low Code Modeler supports Plugin Nodes for integrating external ML services (e.g., from QHAna).

### Using Plugin Nodes

1. Add a "Plugin" node from the node palette
2. Configure the plugin settings:
   - **Plugin Name**: Name of the ML algorithm (e.g., "quantum-k-means")
   - **Plugin Identifier**: Unique identifier for the plugin
   - **API Root**: URL of the plugin service
3. Connect inputs and outputs according to the plugin's interface

### Integration with QHAna

For full ML workflow support, you can integrate with QHAna Plugin Runner:

1. Start the QHAna Plugin Runner on port 5005
2. Start the QHAna Registry on port 5006
3. Start the QHAna Backend on port 9090
4. Configure the LCM to communicate with these services

## Execution in Docker

To build and run an own image execute:

```bash
docker build -t low-code-modeler .
docker run --name low-code-modeler -p 4242:4242 \
  -e VITE_LOW_CODE_BACKEND=http://host.docker.internal:8000 \
  low-code-modeler
```

Afterwards the application is available in a browser on [http://localhost:4242](http://localhost:4242).

## Directory Structure

- docs – Contains documentation, use cases, and relevant guides.

- src – logic for modeling constructs and validation.

- public – Public assets and static files.

- THIRD_PARTY_LICENSES – Contains third-party licenses and dependencies.


## Disclaimer of Warranty

Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its
Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including,
without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work
and assume any risks associated with Your exercise of permissions under this License.

## Haftungsausschluss

Dies ist ein Forschungsprototyp. Die Haftung für entgangenen Gewinn, Produktionsausfall, Betriebsunterbrechung,
entgangene Nutzungen, Verlust von Daten und Informationen, Finanzierungsaufwendungen sowie sonstige Vermögens- und
Folgeschäden ist, außer in Fällen von grober Fahrlässigkeit, Vorsatz und Personenschäden, ausgeschlossen.
