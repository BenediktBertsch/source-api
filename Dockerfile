FROM node:12-slim

ENV port = 
WORKDIR /nodeapp
COPY package.json /nodeapp
COPY tsconfig.json /nodeapp
COPY index.js /nodeapp
RUN npm install
CMD ["node", "index.js"]