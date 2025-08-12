import React, { useState, useRef, useEffect } from 'react'
import { Upload, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Trash2 } from 'lucide-react'

interface Track {
  id: string
  name: string
  url: string
  duration: number
}

function App() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load tracks from localStorage on mount
  useEffect(() => {
    const savedTracks = localStorage.getItem('mp3-player-tracks')
    if (savedTracks) {
      setTracks(JSON.parse(savedTracks))
    }
  }, [])

  // Save tracks to localStorage whenever tracks change
  useEffect(() => {
    localStorage.setItem('mp3-player-tracks', JSON.stringify(tracks))
  }, [tracks])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => handleNext()

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)
        
        audio.addEventListener('loadedmetadata', () => {
          const newTrack: Track = {
            id: Date.now().toString() + Math.random().toString(36),
            name: file.name.replace(/\.[^/.]+$/, ''),
            url,
            duration: audio.duration
          }
          setTracks(prev => [...prev, newTrack])
        })
      }
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePlay = (track?: Track) => {
    const audio = audioRef.current
    if (!audio) return

    if (track && track !== currentTrack) {
      setCurrentTrack(track)
      audio.src = track.url
      audio.load()
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handlePrevious = () => {
    if (!currentTrack) return
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id)
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1
    if (tracks[previousIndex]) {
      handlePlay(tracks[previousIndex])
    }
  }

  const handleNext = () => {
    if (!currentTrack) return
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id)
    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
    if (tracks[nextIndex]) {
      handlePlay(tracks[nextIndex])
    }
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newTime = parseFloat(event.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newVolume = parseFloat(event.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const deleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId))
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null)
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Music className="w-10 h-10" />
            MP3 Player
          </h1>
          <p className="text-gray-300">Upload and play your favorite tracks</p>
        </header>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center">
            <label className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              Upload MP3 Files
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Player Controls */}
        {currentTrack && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold">{currentTrack.name}</h3>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-300 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={tracks.length === 0}
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => handlePlay()}
                className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </button>
              
              <button
                onClick={handleNext}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={tracks.length === 0}
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center gap-2">
              <button onClick={toggleMute} className="p-1 hover:bg-white/20 rounded">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Tracks ({tracks.length})</h2>
          
          {tracks.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No tracks uploaded yet. Upload some MP3 files to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    currentTrack?.id === track.id
                      ? 'bg-purple-600/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => handlePlay(track)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isPlaying && currentTrack?.id === track.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className="font-medium">{track.name}</p>
                      <p className="text-sm text-gray-300">{formatTime(track.duration)}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

export default App