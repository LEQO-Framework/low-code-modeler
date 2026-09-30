# Quantum Low-Code Modeler – Qonstruct

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Qonstruct is a collaborative low-code modeling environment for designing, transforming, and executing quantum applications.

It provides a visual modeling interface that allows users to create quantum application models without manually implementing every underlying technical detail. Qonstruct integrates domain profiles, reusable pattern solutions, AI-assisted model generation, and backend services to support the development and execution of quantum applications.

## Features

- **Visual low-code modeling**  
  Create and edit quantum application models using an intuitive graphical modeling environment.

- **Collaborative modeling**  
  Work collaboratively on models through the integrated collaboration backend.

- **Quantum application execution**  
  Transform models into executable quantum workflows or quantum circuits and interact with connected execution services.

- **AI-assisted model generation**  
  Generate low-code models from natural-language descriptions.

- **Algorithm detection**  
  Analyze natural-language descriptions to identify suitable low-code modeling models.

- **Domain profiles**  
  Define, load, and manage domain-specific modeling constructs and reusable profiles.

- **Pattern integration**  
  Create, update, and inspect pattern solutions associated with quantum applications.

- **User Templates**  
  Create and manage reusable templates to extend the modeling environment.

- **OpenQASM support**  
  Import OpenQASM representations directly into the modeling environment.

- **JSON and diagram import/export**  
  Import and export models using supported JSON and diagram formats.

## Requirements

Before running Qonstruct locally, make sure the following software is installed:

- [Node.js](https://nodejs.org/) 22.x or newer
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/LEQO-Framework/low-code-modeler.git
cd low-code-modeler
```

### 2. Start Qonstruct with Docker

To start Qonstruct together with its Docker-based services, run:

```bash
docker-compose up --build
```

### 3. Open Qonstruct

Once the application has started, open the following URL in your browser:

```text
http://localhost:4242
```

### Local Development

Alternatively, Qonstruct can be started directly using the local development environment.

From the Qonstruct project root, install the dependencies:

```bash
pnpm install
```

Then start the development server:

```bash
npm run dev
```

The application is available at:

```text
http://localhost:4242
```

## Domain Profiles

Qonstruct supports loading domain profiles directly from a shared repository.

To enable repository-based domain profiles, set the following environment variable to the raw base URL of a publicly accessible repository:

```env
VITE_DOMAIN_PROFILES_URL=https://raw.githubusercontent.com/<owner>/<repo>/main
```

Once configured, the **Domain Profile** dialog provides a **Load from Repository** option. Users can select a domain and revision and load the corresponding profile directly into Qonstruct.

### Repository Structure

The domain profile repository is a static file tree and does not require a dedicated backend.

```text
index.json
<directory>/<version>.json
```

The `index.json` file describes the available domains and revisions:

```json
{
  "domains": [
    {
      "name": "Example Domain",
      "directory": "example",
      "versions": ["1.0.0", "1.1.0"],
      "latest": "1.1.0"
    }
  ]
}
```

Each profile contains the corresponding domain model, including its blocks grouped by category.

The repository can be hosted using:

- GitHub Raw
- GitHub Pages
- Another raw Git hosting service
- A static file server

If `VITE_DOMAIN_PROFILES_URL` is not configured, repository-based domain profiles are disabled and the corresponding UI option is hidden.

## Linting

Qonstruct uses **Oxlint** for static analysis.

Oxlint is included as a development dependency and is installed automatically with the project dependencies.

Run Oxlint using pnpm:

```bash
pnpm exec oxlint .
```

Alternatively, using npm:

```bash
npm install
npx oxlint .
```

The linting configuration is located in:

```text
oxlint.config.ts
```

Oxlint is also executed automatically by GitHub Actions for pull requests targeting `main`.

## Pattern Integration

Qonstruct can be used to create and update pattern solutions and to visualize the underlying quantum computing patterns of an algorithm.

Full pattern integration requires the following services:

- Database
- QC-Atlas
- Pattern Atlas API
- Pattern Atlas UI

The required services can be started using the Docker setup provided by the **QuantME Use Cases** repository:

[QuantME Use Cases – Docker Setup](https://github.com/UST-QuAntiL/QuantME-UseCases/tree/fix/2025-icse-docker/2025-icse/docker)

## Project Structure

```text
├── src/                    # Modeling logic and validation
├── public/                 # Public assets
├── backend/                # Collaboration backend
├── oxlint.config.ts        # Oxlint configuration
├── Dockerfile              # Docker image definition
└── THIRD_PARTY_LICENSES    # Third-party licenses and dependencies
```

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
