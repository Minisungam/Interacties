FROM node:20

RUN useradd -m -u 1001 node_user

WORKDIR /usr/src/interacties

COPY package*.json ./

RUN npm install

# Copy only necessary files (excluding sensitive configs)
COPY public/ public/
COPY views/ views/
COPY services/ services/
COPY entities/ entities/
COPY index.mjs ./
COPY config_template.json ./

USER node_user

EXPOSE 5500

# To run with external config:
# docker run -p 5500:5500 -v /path/to/config.json:/usr/src/interacties/config.json -d minisungam/interacties
CMD ["node", "index.mjs"]