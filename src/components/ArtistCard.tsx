import React from 'react';
import { NormalizedArtist } from '../types';
import { UserCheck } from 'lucide-react';

interface ArtistCardProps {
  artist: NormalizedArtist;
  onClick: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  return (
    <div
      id={`artist-card-${artist.id}`}
      onClick={onClick}
      className="group flex-shrink-0 w-36 sm:w-44 p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-800/80 border border-neutral-800/60 hover:border-neutral-700/80 transition-all duration-300 cursor-pointer text-center select-none"
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden mb-3 bg-neutral-800 shadow-md ring-2 ring-transparent group-hover:ring-cyan-500/50 transition-all duration-300">
        <img
          src={artist.thumbnail}
          alt={artist.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <h4 className="font-semibold text-sm text-neutral-100 group-hover:text-cyan-400 truncate transition-colors">
        {artist.name}
      </h4>
      <p className="text-xs text-neutral-500 flex items-center justify-center gap-1 mt-0.5">
        <UserCheck className="w-3 h-3" />
        {artist.subscribers || 'Artist'}
      </p>
    </div>
  );
};
