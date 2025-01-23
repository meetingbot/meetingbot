FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . .

RUN pnpm build


ENV NODE_ENV production


EXPOSE 3001

CMD ["pnpm", "start"]