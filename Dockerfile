FROM node:12-slim

ENV port = 
WORKDIR /nodeapp
COPY package.json /nodeapp
COPY tsconfig.json /nodeapp
ADD src /nodeapp/src
RUN npm install --prod
CMD ["node", "index.js"]