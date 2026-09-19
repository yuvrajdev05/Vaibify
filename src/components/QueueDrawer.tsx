import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import { X, Trash2, ListMusic, ChevronUp, ChevronDown, Play, Music } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    toggleQueue,
    queue,
    currentIndex,
    currentSong,
    isPlaying,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playQueue,
  } = usePlayer();

  if (!isQueueOpen) return null;

  const nowPlaying = currentSong;
  const upNext = queue.slice(currentIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        id="inaya-queue-drawer"
        className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col text-neutral-100 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base sm:text-lg">Play Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-xs font-semibold text-neutral-400">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 text-xs flex items-center gap-1 transition-colors"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={() => toggleQueue(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Now Playing Section */}
          {nowPlaying && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                Now Playing
              </div>
              <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                    <img
                      src={nowPlaying.thumbnail}
                      alt={nowPlaying.title}
                      className="w-full h-full object-cover"
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-2 gap-0.5">
                        <span className="w-1 h-3 bg-cyan-400 animate-pulse" />
                        <span className="w-1 h-5 bg-cyan-400 animate-pulse delay-75" />
                        <span className="w-1 h-2 bg-cyan-400 animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-white truncate">
                      {nowPlaying.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {nowPlaying.artist}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-400/80 shrink-0">
                  {formatDuration(nowPlaying.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
              <span>Next Up ({upNext.length})</span>
            </div>

            {upNext.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-xs space-y-2">
                <Music className="w-6 h-6 mx-auto text-neutral-600" />
                <p>No more songs in queue.</p>
                <p className="text-[11px] text-neutral-600">
                  Browse or search songs and click "Add to queue".
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((song, idx) => {
                  if (idx <= currentIndex) return null; // Only show up next
                  const realQueueIdx = idx;

                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className="group flex items-center justify-between p-2 rounded-xl bg-neutral-950/40 hover:bg-neutral-800/70 border border-neutral-800/60 transition-all"
                    >
                      <div
                        onClick={() => playQueue(queue, realQueueIdx)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                          <img
                            src={song.thumbnail}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs text-neutral-200 truncate group-hover:text-cyan-400 transition-colors">
                            {song.title}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {song.artist}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up / Down */}
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          {realQueueIdx > currentIndex + 1 && (
                            <button
                              onClick={() => reorderQueue(realQueueIdx, realQueueIdx - 1)}
                              className="p-0.5 text-neutral-400 hover:text-white"
                              title="Move up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {realQueueIdx < queue.length - 1 && (
                            <button
                              onClick={() => reorderQueue(realQueueIdx, realQueueIdx + 1)}
                              className="p-0.5 text-neutral-400 hover:text-white"
                              title="Move down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-neutral-500 w-9 text-right">
                          {formatDuration(song.duration)}
                        </span>

                        <button
                          onClick={() => removeFromQueue(realQueueIdx)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
