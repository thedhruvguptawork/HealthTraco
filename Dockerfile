FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install --production

# Bundle app source
COPY . .

# Bind the port that the image will run on
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD [ "npm", "start" ]
