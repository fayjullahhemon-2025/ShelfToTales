'use client';

import React, { useState } from 'react';
import { useRoomMusic } from '../../../contexts/RoomMusicContext';
import { useLofi } from '../../../contexts/LofiContext';

export default function RoomMusicPlayerPanel({ isAdmin, onOpenAdmin }) {
  const {
    isPlaying,
    currentTrack,
    tracks,
    currentTrackId,
    nextTrack,
    prevTrack,
    togglePlay,
    playTrack,
  } = useRoomMusic();
  const { ambientStates, ambientSounds, toggleAmbient } = useLofi();

  const [showTracks, setShowTracks] = useState(false);

  return (
    <div className="rp-music-panel">
      <div className="rp-music-header">
        <h4 className="rp-music-title">
          <i className="fa-solid fa-headphones" /> Room Music
        </h4>
        {isAdmin && (
          <button
            className="rp-admin-btn"
            onClick={onOpenAdmin}
            aria-label="Manage playlist"
          >
            <i className="fa-solid fa-gear" /> Manage
          </button>
        )}
      </div>

      <div className="rp-now-playing">
        <div className="rp-track-info">
          <p className="rp-track-name">{currentTrack?.title || 'No track selected'}</p>
          <p className="rp-track-artist">{currentTrack?.artist || ''}</p>
        </div>
        <div className="rp-controls">
          <button onClick={prevTrack} className="rp-ctrl-btn" disabled={tracks.length === 0} aria-label="Previous track">
            <i className="fa-solid fa-backward-step" />
          </button>
          <button onClick={togglePlay} className="rp-play-btn" disabled={!currentTrackId} aria-label={isPlaying ? 'Pause' : 'Play'}>
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>
          <button onClick={nextTrack} className="rp-ctrl-btn" disabled={tracks.length === 0} aria-label="Next track">
            <i className="fa-solid fa-forward-step" />
          </button>
        </div>
      </div>

      <div className="rp-ambient">
        {ambientSounds.map((sound) => {
          const state = ambientStates?.[sound.id] || { active: false };
          return (
            <button
              key={sound.id}
              className={`rp-ambient-btn ${state.active ? 'active' : ''}`}
              onClick={() => toggleAmbient(sound.id)}
              aria-label={`${state.active ? 'Disable' : 'Enable'} ${sound.name} ambient sound`}
            >
              <i className={`fa-solid ${sound.icon}`} /> {sound.name}
            </button>
          );
        })}
      </div>

      <button
        className="rp-tracklist-toggle"
        onClick={() => setShowTracks(!showTracks)}
        aria-expanded={showTracks}
      >
        <i className={`fa-solid ${showTracks ? 'fa-chevron-up' : 'fa-chevron-down'}`} />{' '}
        Room Playlist ({tracks?.length || 0} tracks)
      </button>

      {showTracks && (
        <div className="rp-tracklist">
          {tracks?.map((track) => (
            <div
              key={track.id}
              className={`rp-track-item ${track.id === currentTrackId ? 'active' : ''}`}
              onClick={() => playTrack(track.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') playTrack(track.id); }}
            >
              <span className="rp-track-num" />
              <div className="rp-track-item-info">
                <span className="rp-track-item-title">{track.title}</span>
                <span className="rp-track-item-artist">{track.artist}</span>
              </div>
            </div>
          ))}
          {(!tracks || tracks.length === 0) && (
            <p className="rp-tracklist-empty">No tracks yet — admin can upload via Manage.</p>
          )}
        </div>
      )}
    </div>
  );
}
