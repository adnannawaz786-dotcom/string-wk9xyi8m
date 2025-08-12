// Audio file related types
export interface AudioFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  duration: number;
  size: number;
  type: string;
  dateAdded: Date;
  lastPlayed?: Date;
  playCount: number;
}

// Playlist related types
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: AudioFile[];
  createdAt: Date;
  updatedAt: Date;
  duration: number;
  trackCount: number;
}

// Player state and controls
export interface PlayerState {
  currentTrack: AudioFile | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeat: RepeatMode;
  shuffle: boolean;
  queue: AudioFile[];
  currentIndex: number;
}

export type RepeatMode = 'none' | 'one' | 'all';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

// Audio metadata
export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
}

// File upload and validation
export interface FileUploadResult {
  success: boolean;
  file?: AudioFile;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  size?: number;
  type?: string;
}

// Storage and persistence
export interface StorageData {
  audioFiles: AudioFile[];
  playlists: Playlist[];
  playerSettings: PlayerSettings;
  lastSession?: SessionData;
}

export interface PlayerSettings {
  volume: number;
  playbackRate: number;
  repeat: RepeatMode;
  shuffle: boolean;
  autoplay: boolean;
  crossfade: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface SessionData {
  currentTrackId?: string;
  currentTime: number;
  queue: string[];
  currentIndex: number;
  timestamp: Date;
}

// Component props
export interface AudioPlayerProps {
  className?: string;
  audioFiles?: AudioFile[];
  onTrackChange?: (track: AudioFile | null) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  autoplay?: boolean;
}

export interface PlaylistManagerProps {
  audioFiles: AudioFile[];
  playlists: Playlist[];
  onPlaylistCreate: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onPlaylistUpdate: (id: string, updates: Partial<Playlist>) => void;
  onPlaylistDelete: (id: string) => void;
  onPlayTrack: (track: AudioFile) => void;
}

// Event handlers
export type AudioEventHandler = (event: Event) => void;
export type TrackChangeHandler = (track: AudioFile | null, index: number) => void;
export type PlaylistChangeHandler = (playlist: Playlist) => void;
export type VolumeChangeHandler = (volume: number) => void;
export type TimeUpdateHandler = (currentTime: number, duration: number) => void;

// Error types
export interface AudioError {
  code: AudioErrorCode;
  message: string;
  track?: AudioFile;
  timestamp: Date;
}

export type AudioErrorCode = 
  | 'LOAD_ERROR'
  | 'PLAYBACK_ERROR'
  | 'NETWORK_ERROR'
  | 'DECODE_ERROR'
  | 'STORAGE_ERROR'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_NOT_FOUND';

// Utility types
export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'dateAdded' | 'duration' | 'playCount' | 'lastPlayed';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface FilterConfig {
  search?: string;
  genre?: string;
  artist?: string;
  minDuration?: number;
  maxDuration?: number;
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

// Export/Import types
export interface ExportData {
  version: string;
  exportDate: Date;
  playlists: Playlist[];
  settings: PlayerSettings;
}

export interface ImportResult {
  success: boolean;
  playlistsImported: number;
  errors: string[];
}