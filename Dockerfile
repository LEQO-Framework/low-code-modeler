FROM node:20-alpine

WORKDIR /low-code-modeler

RUN npm install -g pnpm@9.15.2

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4242

CMD ["pnpm", "run", "exposed-port"]