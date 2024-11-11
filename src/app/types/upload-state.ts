interface UploadState {
  currentStage?: string;
  currentFile?: string;
  processingDetails?: Array<{
    name: string;
    status: 'completed' | 'processing' | 'waiting';
  }>;
  lastApiCall?: any;
}
