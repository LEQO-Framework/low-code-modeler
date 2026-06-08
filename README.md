# Quantum Low-Code Modeler

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A (collaborative) low-code modeler which allows modeling and executing quantum applications.

## Requirements

- Node.js 22.x+
- pnpm
- Docker & Docker Compose

## Quick Start

Make sure to start:

1. **leqo-backend**: `cd leqo-backend && docker compose -f compose-dev.yaml up -d` (runs on port 8000)
2. **Configure**: Create `.env` with `VITE_LOW_CODE_BACKEND=http://localhost:8000`
3. **Low-Code Modeler Collaboration Backend** : `cd backend && npm install && npm run dev` 
4. **Low Code Modeler**: `pnpm install && npm run dev` (runs on port 4242)
5. **Open**: http://localhost:4242

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

## Pattern Integration Requirements

The Quantum Low-Code Modeler can be used to create or update pattern solutions and display the underlying quantum computing patterns of an algorithm.

To ensure full functionality, the following projects must be running:

- Database

- QC-Atlas

- Pattern Atlas API

- Pattern Atlas UI

You can start all required services using the provided Docker setup here:
https://github.com/UST-QuAntiL/QuantME-UseCases/tree/fix/2025-icse-docker/2025-icse/docker

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
