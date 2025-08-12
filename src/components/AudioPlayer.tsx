import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Trash2 } from 'lucide-react'

interface AudioFile {
  id: string
  name: string
  url: string
  duration: number
}

interface AudioPlayerProps {
  className?: string
}

export default function AudioPlayer({ className = '' }: AudioPlayerProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load audio files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('audioFiles')
    if (savedFiles) {
      setAudioFiles(JSON.parse(savedFiles))
    }
  }, [])

  // Save audio files to localStorage whenever audioFiles changes
  useEffect(() => {
    localStorage.setItem('audioFiles', JSON.stringify(audioFiles))
  }, [audioFiles])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      playNext()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)
        
        audio.addEventListener('loadedmetadata', () => {
          const newFile: AudioFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: url,
            duration: audio.duration
          }
          
          setAudioFiles(prev => [...prev, newFile])
        })
      }
    })

    // Reset input
    event.target.value = ''
  }

  const playTrack = (track: AudioFile, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause()
    } else {
      setCurrentTrack(track)
      setCurrentIndex(index)
      setIsPlaying(true)
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (audioFiles.length === 0) return
    const nextIndex = (currentIndex + 1) % audioFiles.length
    setCurrentTrack(audioFiles[nextIndex])
    setCurrentIndex(nextIndex)
    setIsPlaying(true)
  }

  const playPrevious = () => {
    if (audioFiles.length === 0) return
    const prevIndex = currentIndex === 0 ? audioFiles.length - 1 : currentIndex - 1
    setCurrentTrack(audioFiles[prevIndex])
    setCurrentIndex(prevIndex)
    setIsPlaying(true)
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (parseFloat(event.target.value) / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value) / 100
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const deleteTrack = (trackId: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== trackId))
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null)
      setIsPlaying(false)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Upload Section */}
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="audio/*"
          multiple
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Upload size={20} />
          Upload Audio Files
        </button>
      </div>

      {/* Playlist */}
      <div className="mb-6 max-h-60 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-3">Playlist</h3>
        {audioFiles.length === 0 ? (
          <p className="text-gray-500">No audio files uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {audioFiles.map((file, index) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentTrack?.id === file.id
                    ? 'bg-blue-100 border-2 border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => playTrack(file, index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    {currentTrack?.id === file.id && isPlaying ? (
                      <Pause size={16} className="text-white" />
                    ) : (
                      <Play size={16} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatTime(file.duration)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTrack(file.id)
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Controls */}
      {currentTrack && (
        <div className="border-t pt-6">
          <div className="text-center mb-4">
            <h4 className="font-medium truncate">{currentTrack.name}</h4>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={playPrevious}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SkipBack size={24} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={playNext}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SkipForward size={24} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}