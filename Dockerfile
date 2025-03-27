FROM node:20

RUN useradd -m -u 1001 node_user

WORKDIR /usr/src/interacties

COPY package*.json ./

RUN npm install

COPY . .

USER node_user

EXPOSE 5500

CMD ["node", "index.mjs"]