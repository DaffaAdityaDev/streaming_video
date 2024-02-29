import { Server } from "socket.io";

interface filePath {
  filePath: string;
}

export interface Task {
  filePath: string;
  resolutionConfig: {
    width: string;
    outputDir: string;
    bitrate: string;
  };
  outputPath: string;
  res: string;
  io: Server;
  totalVideos: number;
  processedVideos: number;
  uniqueId: string;
}

export interface ResolutionConfig {
  bitrate: string;
  width: string;
  outputDir: string;
 }