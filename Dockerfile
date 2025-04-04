FROM node:lts-alpine

RUN adduser -D -u 1001 node_user

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY public/ public/
COPY views/ views/
COPY services/ services/
COPY entities/ entities/
COPY index.mjs ./

RUN chown -R node_user:node_user /app

USER node_user

EXPOSE 5500

CMD ["node", "index.mjs"]