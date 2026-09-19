import React from 'react';
import { NormalizedAlbum } from '../types';
import { Disc3, Play } from 'lucide-react';

interface AlbumCardProps {
  album: NormalizedAlbum;
  onClick: () => void;
  onPlay?: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick, onPlay }) => {
  return (
    <div
      id={`album-card-${album.id}`}
      onClick={onClick}
      className="group flex-shrink-0 w-40 sm:w-48 p-3 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800/80 border border-neutral-800/70 hover:border-neutral-700 transition-all duration-300 cursor-pointer select-none"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md">
        <img
          src={album.thumbnail}
          alt={album.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-black/60 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
            title="Play Album"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}
      </div>

      <h4 className="font-semibold text-sm text-neutral-100 group-hover:text-cyan-400 truncate transition-colors">
        {album.title}
      </h4>
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mt-0.5">
        <span className="truncate">{album.artist}</span>
        {album.year && (
          <>
            <span>•</span>
            <span>{album.year}</span>
          </>
        )}
      </div>
      {album.trackCount && (
        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1">
          <Disc3 className="w-3 h-3" />
          {album.trackCount} songs
        </div>
      )}
    </div>
  );
};
