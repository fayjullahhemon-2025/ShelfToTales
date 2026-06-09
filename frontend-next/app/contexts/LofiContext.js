'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';

// ---------------------------------------------------------------------------
// Config & Constants
// ---------------------------------------------------------------------------

export const TRACKS = [
  {
    title: "Autumn Rainfall",
    artist: "Lofi Girl & Study Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "Chill Study Beats",
    artist: "Study Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "Late Night Latte",
    artist: "Lofi Cafe",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "Forest Whisper",
    artist: "Nature Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=300"
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: 'fa-cloud-showers-heavy', url: 'https://www.soundjay.com/nature/sounds/rain-07.mp3' },
  { id: 'cafe', name: 'Cafe', icon: 'fa-mug-hot', url: 'https://www.soundjay.com/nature/sounds/river-1.mp3' },
  { id: 'fire', name: 'Fire', icon: 'fa-fire', url: 'https://www.soundjay.com/nature/sounds/fire-1.mp3' },
  { id: 'nature', name: 'Nature', icon: 'fa-leaf', url: 'https://www.soundjay.com/nature/sounds/forest-wind-1.mp3' }
];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const LofiContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LofiProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  const [ambientStates, setAmbientStates] = useState({
    rain: { active: false, volume: 0.5 },
    cafe: { active: false, volume: 0.5 },
    fire: { active: false, volume: 0.5 },
    nature: { active: false, volume: 0.5 },
  });

  const musicAudioRef = useRef(null);
  const ambientAudioRefs = useRef({});
  const isInitialized = useRef(false);

  // Refs for tracking functions in event listeners to prevent closures
  const nextTrackRef = useRef(null);

  const nextTrack = () => {
    setIsPlaying(true);
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setIsPlaying(true);
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + TRACKS.length) % TRACKS.length);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  });

  // Client-side initialization of audio players
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const musicAudio = new Audio();
    musicAudioRef.current = musicAudio;

    const handleTimeUpdate = () => {
      setCurrentTime(musicAudio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(musicAudio.duration || 0);
    };

    const handleEnded = () => {
      if (nextTrackRef.current) {
        nextTrackRef.current();
      }
    };

    musicAudio.addEventListener('timeupdate', handleTimeUpdate);
    musicAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    musicAudio.addEventListener('ended', handleEnded);

    // Initialize ambient sounds
    AMBIENT_SOUNDS.forEach((sound) => {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = ambientStates[sound.id].volume;
      ambientAudioRefs.current[sound.id] = audio;
    });

    isInitialized.current = true;

    return () => {
      musicAudio.removeEventListener('timeupdate', handleTimeUpdate);
      musicAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      musicAudio.removeEventListener('ended', handleEnded);
      musicAudio.pause();
      
      Object.values(ambientAudioRefs.current).forEach((audio) => {
        audio.pause();
      });
    };
  }, []);

  // Sync music state with HTML5 audio
  useEffect(() => {
    if (!isInitialized.current || !musicAudioRef.current) return;

    const currentTrack = TRACKS[currentTrackIndex];
    if (musicAudioRef.current.src !== currentTrack.url) {
      musicAudioRef.current.src = currentTrack.url;
      musicAudioRef.current.load();
    }

    musicAudioRef.current.volume = volume;

    if (isPlaying) {
      musicAudioRef.current.play().catch((err) => {
        console.error("Lofi music playback failed/blocked:", err);
        setIsPlaying(false);
      });
    } else {
      musicAudioRef.current.pause();
    }
  }, [currentTrackIndex, isPlaying, volume]);

  const changeVolume = (newVol) => {
    setVolumeState(newVol);
  };

  const seek = (seconds) => {
    if (musicAudioRef.current) {
      musicAudioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const toggleAmbient = (id) => {
    setAmbientStates((prev) => {
      const target = prev[id];
      const nextActive = !target.active;
      const audio = ambientAudioRefs.current[id];
      if (audio) {
        if (nextActive) {
          audio.play().catch((err) => {
            console.error(`Failed to play ambient sound ${id}:`, err);
          });
        } else {
          audio.pause();
        }
      }
      return {
        ...prev,
        [id]: { ...target, active: nextActive },
      };
    });
  };

  const setAmbientVolume = (id, vol) => {
    setAmbientStates((prev) => {
      const target = prev[id];
      const audio = ambientAudioRefs.current[id];
      if (audio) {
        audio.volume = vol;
      }
      return {
        ...prev,
        [id]: { ...target, volume: vol },
      };
    });
  };

  const currentTrack = TRACKS[currentTrackIndex];

  const value = useMemo(
    () => ({
      isPlaying,
      currentTime,
      duration,
      volume,
      currentTrackIndex,
      tracks: TRACKS,
      currentTrack,
      ambientStates,
      ambientSounds: AMBIENT_SOUNDS,
      nextTrack,
      prevTrack,
      togglePlay,
      setVolume: changeVolume,
      seek,
      toggleAmbient,
      setAmbientVolume,
    }),
    [isPlaying, currentTime, duration, volume, currentTrackIndex, ambientStates, currentTrack]
  );

  return <LofiContext.Provider value={value}>{children}</LofiContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLofi() {
  const context = useContext(LofiContext);
  if (!context) {
    throw new Error('useLofi must be used within a LofiProvider');
  }
  return context;
}

export default LofiContext;
