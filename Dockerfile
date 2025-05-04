FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY config ./config

RUN yarn build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/config ./config

RUN yarn install --frozen-lockfile --production

CMD ["node", "build/src/index.js"]
