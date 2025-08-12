import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) {
    return "0:00"
  }
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(duration: number): string {
  return formatTime(duration)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function validateAudioFile(file: File): boolean {
  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a']
  return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.mp3')
}

export function getFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()
}

export function extractFileName(filePath: string): string {
  return filePath.split('/').pop()?.split('.')[0] || 'Unknown'
}

export function createAudioUrl(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url)
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function parseAudioMetadata(file: File): Promise<{
  title: string
  artist: string
  duration: number
}> {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = createAudioUrl(file)
    
    audio.addEventListener('loadedmetadata', () => {
      const title = extractFileName(file.name)
      resolve({
        title,
        artist: 'Unknown Artist',
        duration: audio.duration
      })
      revokeAudioUrl(url)
    })
    
    audio.addEventListener('error', () => {
      resolve({
        title: extractFileName(file.name),
        artist: 'Unknown Artist',
        duration: 0
      })
      revokeAudioUrl(url)
    })
    
    audio.src = url
  })
}

export function exportPlaylist(playlist: any[], name: string): void {
  const data = {
    name,
    tracks: playlist,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileName(name)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function isValidPlaylistFile(file: File): boolean {
  return file.type === 'application/json' && file.name.endsWith('.json')
}