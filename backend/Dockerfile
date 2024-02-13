# Use an official Node.js runtime as the base image
FROM node:lts

# Set the working directory in the container
WORKDIR /usr

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY ./prisma prisma
# Copy the rest of the application files to the working directory
COPY . .

# Install application dependencies
RUN npm install
RUN npm run generate

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 8000

# Define the command to start the application
CMD ["npm", "run", "start"]