# Use the official Node.js LTS version as the base image
FROM node:lts

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port that the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]