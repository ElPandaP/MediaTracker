export interface NetflixMedia {
  title: string;
  year?: number;
  type: 'movie' | 'series';
  genres: string[];
  duration?: string;
  description?: string;
  imageUrl?: string;
  netflixUrl: string;
  extractedAt: string;

  // Extra fields for series
  season?: number;
  episode?: number;
  episodeTitle?: string;

  // Live playback state (only available while watching, on a /watch/ page)
  progressPercent?: number;   // 0–100, how far into the video you are
  positionSeconds?: number;   // current playback position
  runtimeSeconds?: number;    // total length of the movie / episode
}

export interface ExtractDataMessage {
  action: 'extractData';
}

export interface ExtractDataResponse {
  success: boolean;
  data?: NetflixMedia;
  error?: string;
}