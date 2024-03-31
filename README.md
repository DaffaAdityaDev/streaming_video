# Streaming Video Service
![alt text](/frontend/public/Capture.JPG)

This project is a backend service for a streaming video platform. It allows users to upload, store, and access videos in different resolutions. The service is designed to handle video storage, retrieval, and potentially streaming functionalities.

## Features
- Video upload and processing
- Simple Video management
- Video streaming in different resolutions
- comments on individual video
- Thumbnail generation for videos
- User authentication and video metadata management
- Docker containerization for easy deployment

## Technologies
- **TypeScript**: For writing robust and maintainable code.
- **Node.js**: As the runtime environment for the backend logic.
- **Prisma**: For database management and ORM.
- **Docker**: For containerization and easy deployment.
- **Socket.IO**: For real-time communication between the server and clients.
- **Next.js**: For the frontend framework.
- **React**: For building the user interface.
- **Tailwind CSS**: For styling the frontend.

## Project Structure
**`backend/`**: Contains the backend code.
 - `src/`: Source code.
 - `prisma/`: Prisma schema for database management.
 - `build/`: Compiled code.
 - `data.txt`: Possibly some sample data.
 - `thumbnails/`: Contains thumbnail images for videos (generated automatically).
 - `video/`: Contains videos in different resolutions (generated automatically).

**`frontend/`**: Contains the frontend code.
 - `src/`: Source code.
 - `public/`: Static assets.
 - `pages/`: Next.js pages.
 - `components/`: React components.
 - `styles/`: Stylesheets.


## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the backend in development mode with hot-reloading enabled.

### `npm run build`

Builds the backend for production to the `build` folder.

### `npm run start`

Starts the backend in production mode.

### `npm run generate`

Generates Prisma client for database access.

### `npm run deploy`

Deploys the Prisma schema to the database.

### `npm run format`

Formats the codebase using Prettier.

## Docker

The project uses Docker for containerization. The `docker-compose.yml` file defines services for the frontend and backend, and the `Dockerfile` files in the `frontend` and `backend` directories specify how to build the Docker images.

### `docker-compose build`

Builds the Docker images for the frontend and backend.

### `docker-compose up -d`

Starts the Docker containers in detached mode.

### `docker-compose down`

Stops and removes the Docker containers.

## Getting Started

To start the project, you can use the provided `start-project.sh` script. This script will build the Docker images and start the containers.

## Contributing

Contributions are welcome. Please ensure that your code adheres to the existing style to keep the codebase consistent.

## License

This project is licensed under the ISC License.
