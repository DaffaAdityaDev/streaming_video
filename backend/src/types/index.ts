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
}