import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Play, Pause, Music, FolderOpen, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface Track {
  id: string;
  name: string;
  file: File;
  url: string;
  duration?: number;
  size: number;
}

interface PlaylistManagerProps {
  className?: string;
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({ className = '' }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Load tracks from localStorage on mount
  useEffect(() => {
    loadTracksFromStorage();
  }, []);

  const loadTracksFromStorage = useCallback(async () => {
    try {
      const storedTracks = localStorage.getItem('mp3-player-tracks');
      if (storedTracks) {
        const trackData = JSON.parse(storedTracks);
        const restoredTracks: Track[] = [];

        for (const track of trackData) {
          try {
            // Convert base64 back to File
            const response = await fetch(track.url);
            const blob = await response.blob();
            const file = new File([blob], track.name, { type: 'audio/mpeg' });
            
            restoredTracks.push({
              ...track,
              file,
              url: URL.createObjectURL(file)
            });
          } catch (error) {
            console.warn(`Failed to restore track: ${track.name}`, error);
          }
        }

        setTracks(restoredTracks);
      }
    } catch (error) {
      console.error('Failed to load tracks from storage:', error);
    }
  }, []);

  const saveTracksToStorage = useCallback(async (tracksToSave: Track[]) => {
    try {
      const trackData = await Promise.all(
        tracksToSave.map(async (track) => {
          // Convert file to base64 for storage
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onload = () => {
              resolve({
                id: track.id,
                name: track.name,
                url: reader.result,
                duration: track.duration,
                size: track.size
              });
            };
            reader.readAsDataURL(track.file);
          });
        })
      );

      localStorage.setItem('mp3-player-tracks', JSON.stringify(trackData));
    } catch (error) {
      console.error('Failed to save tracks to storage:', error);
    }
  }, []);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newTracks: Track[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/')) {
        const track: Track = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          url: URL.createObjectURL(file),
          size: file.size
        };
        newTracks.push(track);
      }
    });

    if (newTracks.length > 0) {
      const updatedTracks = [...tracks, ...newTracks];
      setTracks(updatedTracks);
      saveTracksToStorage(updatedTracks);
    }
  }, [tracks, saveTracksToStorage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const deleteTrack = useCallback((trackId: string) => {
    const updatedTracks = tracks.filter(track => {
      if (track.id === trackId) {
        URL.revokeObjectURL(track.url);
        if (currentTrack?.id === trackId) {
          setCurrentTrack(null);
          setIsPlaying(false);
        }
        return false;
      }
      return true;
    });
    
    setTracks(updatedTracks);
    saveTracksToStorage(updatedTracks);
  }, [tracks, currentTrack, saveTracksToStorage]);

  const clearPlaylist = useCallback(() => {
    tracks.forEach(track => URL.revokeObjectURL(track.url));
    setTracks([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    localStorage.removeItem('mp3-player-tracks');
  }, [tracks]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleTrackEnd = useCallback(() => {
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
      playTrack(tracks[currentIndex + 1]);
    } else {
      setIsPlaying(false);
    }
  }, [tracks, currentTrack, playTrack]);

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">MP3 Player</h1>
        </div>
        {tracks.length > 0 && (
          <button
            onClick={clearPlaylist}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload MP3 Files
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your audio files here, or click to browse
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
          <FolderOpen className="h-4 w-4" />
          Choose Files
          <input
            type="file"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </label>
      </div>

      {/* Current Player */}
      {currentTrack && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Now Playing</h3>
          <AudioPlayer
            src={currentTrack.url}
            title={currentTrack.name}
            isPlaying={isPlaying}
            onPlayPause={setIsPlaying}
            onEnded={handleTrackEnd}
            className="w-full"
          />
        </div>
      )}

      {/* Playlist */}
      {tracks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Playlist ({tracks.length} tracks)
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  currentTrack?.id === track.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => playTrack(track)}
                      className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {track.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(track.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tracks.length === 0 && (
        <div className="text-center py-12">
          <Music className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tracks in your playlist
          </h3>
          <p className="text-gray-500">
            Upload some MP3 files to get started with your music collection
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;