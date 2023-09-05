
FROM node:16.17.0

WORKDIR /backend_ludo

COPY package*.json ./

RUN npm install
COPY . .
EXPOSE 4001
CMD ["npm", "run", "startDockerBuild"]
