FROM node:20-alpine

WORKDIR /low-code-modeler

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN apk add --no-cache dos2unix && \
     find . -type f -name "*.css" -exec dos2unix {} \;

EXPOSE 4242

CMD ["pnpm", "run", "exposed-port"]
