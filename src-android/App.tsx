import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  StatusBar,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { nativeAudio, SongPayload } from './services/audioBridge';
import { vaibifyApi } from './services/api';

const { width } = Dimensions.get('window');

interface Vibe {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  accentColor: string;
}

const DEFAULT_VIBES: Vibe[] = [
  { id: 'energy', name: 'Energy', emoji: '🔥', tagline: 'High octane beats & pure adrenaline', accentColor: '#f59e0b' },
  { id: 'midnight', name: 'Midnight', emoji: '🌙', tagline: 'Late night cruising & moody vibes', accentColor: '#818cf8' },
  { id: 'chill', name: 'Chill', emoji: '💙', tagline: 'Soft acoustic & relaxed downtempo', accentColor: '#38bdf8' },
  { id: 'focus', name: 'Focus', emoji: '🧠', tagline: 'Instrumental flow & concentration', accentColor: '#34d399' },
  { id: 'drive', name: 'Drive', emoji: '🚗', tagline: 'Open highways & neon synthwave', accentColor: '#c084fc' },
  { id: 'party', name: 'Party', emoji: '🎉', tagline: 'Dance anthems & non-stop celebration', accentColor: '#f43f5e' },
  { id: 'rain', name: 'Rain', emoji: '🌧️', tagline: 'Rainy lo-fi & gentle reflection', accentColor: '#94a3b8' },
  { id: 'love', name: 'Love', emoji: '❤️', tagline: 'Romantic ballads & warm soul', accentColor: '#fb7185' },
  { id: 'workout', name: 'Workout', emoji: '⚡', tagline: 'Beast mode intensity & heavy bass', accentColor: '#fbbf24' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library'>('home');
  const [selectedVibe, setSelectedVibe] = useState<Vibe>(DEFAULT_VIBES[1]);
  const [vibeTracks, setVibeTracks] = useState<SongPayload[]>([]);
  const [loadingVibe, setLoadingVibe] = useState(false);

  // Global Player State
  const [currentSong, setCurrentSong] = useState<SongPayload | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<SongPayload[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);

  // Library State
  const [favorites, setFavorites] = useState<SongPayload[]>([]);
  const [recentTracks, setRecentTracks] = useState<SongPayload[]>([]);
  const [playlists, setPlaylists] = useState<{ id: string; name: string; songs: SongPayload[] }[]>([
    { id: 'p1', name: 'My Daily Vibes', songs: [] },
  ]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SongPayload[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<any>(null);

  // Initialize Native Audio listeners
  useEffect(() => {
    const subState = nativeAudio.addPlaybackStateListener((event) => {
      setIsPlaying(event.isPlaying);
    });

    const subTrack = nativeAudio.addTrackChangedListener((track) => {
      if (track.title) {
        setCurrentSong((prev) => (prev ? { ...prev, title: track.title, artist: track.artist } : null));
      }
    });

    // Load initial Midnight Vibe
    loadVibe(DEFAULT_VIBES[1]);

    return () => {
      subState?.remove();
      subTrack?.remove();
    };
  }, []);

  const loadVibe = async (vibe: Vibe) => {
    setSelectedVibe(vibe);
    setLoadingVibe(true);
    try {
      const data = await vaibifyApi.getVibeMix(vibe.id);
      if (data.tracks && data.tracks.length > 0) {
        setVibeTracks(data.tracks);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingVibe(false);
    }
  };

  const playSong = (song: SongPayload, newQueue?: SongPayload[]) => {
    setCurrentSong(song);
    setIsPlaying(true);

    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((s) => s.id === song.id);
      setCurrentIndex(idx !== -1 ? idx : 0);
    }

    // Call native Android Media3 foreground service
    nativeAudio.play({
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      url: song.url || `https://www.youtube.com/watch?v=${song.id}`,
    });

    // Record in recently played (up to 50 tracks)
    setRecentTracks((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      return [{ ...song, timestamp: Date.now() }, ...filtered].slice(0, 50);
    });
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      nativeAudio.pause();
      setIsPlaying(false);
    } else {
      nativeAudio.resume();
      setIsPlaying(true);
    }
  };

  const skipNext = () => {
    if (queue.length === 0) return;
    const nextIdx = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIdx);
    playSong(queue[nextIdx]);
  };

  const skipPrevious = () => {
    if (queue.length === 0) return;
    const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIdx);
    playSong(queue[prevIdx]);
  };

  const toggleFavorite = (song: SongPayload) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) return prev.filter((s) => s.id !== song.id);
      return [song, ...prev];
    });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const data = await vaibifyApi.search(text.trim(), 'songs');
      setSearchResults(data.songs || []);
      setSearching(false);
    }, 400);
  };

  const triggerQuickMix = async () => {
    try {
      const mix = await vaibifyApi.generateQuickMix(recentTracks, favorites, selectedVibe.id);
      if (mix.tracks && mix.tracks.length > 0) {
        setQueue(mix.tracks);
        setCurrentIndex(0);
        playSong(mix.tracks[0], mix.tracks);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#09090b' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>VAIBIFY</Text>
          <Text style={styles.brandTagline}>Find Your Vibe.</Text>
        </View>
        <TouchableOpacity style={styles.quickMixButton} onPress={triggerQuickMix}>
          <Text style={styles.quickMixText}>⚡ Quick Mix</Text>
        </TouchableOpacity>
      </View>

      {/* Main View Switching */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Vibe Engine Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What's your vibe?</Text>
              <Text style={styles.sectionSubtitle}>Tap a mood to tune the atmosphere</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vibesScroll}>
              {DEFAULT_VIBES.map((vibe) => {
                const isSelected = selectedVibe.id === vibe.id;
                return (
                  <TouchableOpacity
                    key={vibe.id}
                    onPress={() => loadVibe(vibe)}
                    style={[
                      styles.vibeCard,
                      isSelected && { borderColor: vibe.accentColor, backgroundColor: '#181820' },
                    ]}
                  >
                    <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                    <Text style={[styles.vibeName, isSelected && { color: vibe.accentColor }]}>
                      {vibe.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selected Vibe Active Mix */}
            <View style={styles.vibeBanner}>
              <View style={[styles.vibeDot, { backgroundColor: selectedVibe.accentColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeVibeTitle}>{selectedVibe.name} Mix</Text>
                <Text style={styles.activeVibeDesc}>{selectedVibe.tagline}</Text>
              </View>
              <TouchableOpacity
                onPress={() => vibeTracks[0] && playSong(vibeTracks[0], vibeTracks)}
                style={[styles.playVibeBtn, { backgroundColor: selectedVibe.accentColor }]}
              >
                <Text style={styles.playVibeText}>Play</Text>
              </TouchableOpacity>
            </View>

            {/* Track List */}
            {vibeTracks.map((song) => (
              <TouchableOpacity
                key={song.id}
                onPress={() => playSong(song, vibeTracks)}
                style={styles.trackRow}
              >
                <Image source={{ uri: song.thumbnail }} style={styles.trackThumbnail} />
                <View style={styles.trackInfo}>
                  <Text numberOfLines={1} style={styles.trackTitle}>{song.title}</Text>
                  <Text numberOfLines={1} style={styles.trackArtist}>{song.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(song)} style={styles.favButton}>
                  <Text style={{ fontSize: 16 }}>
                    {favorites.some((f) => f.id === song.id) ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeTab === 'search' && (
          <View style={{ flex: 1 }}>
            <View style={styles.searchBoxContainer}>
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search any song, artist or vibe..."
                placeholderTextColor="#71717a"
                style={styles.searchInput}
              />
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item: SongPayload) => item.id}
              renderItem={({ item }: { item: SongPayload }) => (
                <TouchableOpacity
                  onPress={() => playSong(item, searchResults)}
                  style={styles.trackRow}
                >
                  <Image source={{ uri: item.thumbnail }} style={styles.trackThumbnail} />
                  <View style={styles.trackInfo}>
                    <Text numberOfLines={1} style={styles.trackTitle}>{item.title}</Text>
                    <Text numberOfLines={1} style={styles.trackArtist}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {activeTab === 'library' && (
          <ScrollView>
            <Text style={styles.libraryHeader}>Your Favorites ({favorites.length})</Text>
            {favorites.map((song) => (
              <TouchableOpacity
                key={song.id}
                onPress={() => playSong(song, favorites)}
                style={styles.trackRow}
              >
                <Image source={{ uri: song.thumbnail }} style={styles.trackThumbnail} />
                <View style={styles.trackInfo}>
                  <Text numberOfLines={1} style={styles.trackTitle}>{song.title}</Text>
                  <Text numberOfLines={1} style={styles.trackArtist}>{song.artist}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={[styles.libraryHeader, { marginTop: 24 }]}>
              Recently Played ({recentTracks.length})
            </Text>
            {recentTracks.slice(0, 10).map((song) => (
              <TouchableOpacity
                key={song.id}
                onPress={() => playSong(song, recentTracks)}
                style={styles.trackRow}
              >
                <Image source={{ uri: song.thumbnail }} style={styles.trackThumbnail} />
                <View style={styles.trackInfo}>
                  <Text numberOfLines={1} style={styles.trackTitle}>{song.title}</Text>
                  <Text numberOfLines={1} style={styles.trackArtist}>{song.artist}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Persistent Mini Player Bar */}
      {currentSong && (
        <TouchableOpacity
          onPress={() => setFullPlayerVisible(true)}
          style={[styles.miniPlayer, { borderTopColor: selectedVibe.accentColor }]}
        >
          <Image source={{ uri: currentSong.thumbnail }} style={styles.miniThumbnail} />
          <View style={styles.miniInfo}>
            <Text numberOfLines={1} style={styles.miniTitle}>{currentSong.title}</Text>
            <Text numberOfLines={1} style={styles.miniArtist}>{currentSong.artist}</Text>
          </View>

          <TouchableOpacity onPress={skipPrevious} style={styles.controlBtn}>
            <Text style={styles.controlIcon}>⏮️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayPause} style={styles.controlBtn}>
            <Text style={styles.controlIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={skipNext} style={styles.controlBtn}>
            <Text style={styles.controlIcon}>⏭️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={styles.navItem}
        >
          <Text style={[styles.navText, activeTab === 'home' && { color: selectedVibe.accentColor }]}>
            🏠 Vibes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={styles.navItem}
        >
          <Text style={[styles.navText, activeTab === 'search' && { color: selectedVibe.accentColor }]}>
            🔍 Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          style={styles.navItem}
        >
          <Text style={[styles.navText, activeTab === 'library' && { color: selectedVibe.accentColor }]}>
            📚 Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Player Modal */}
      <Modal visible={fullPlayerVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.fullPlayerContainer, { backgroundColor: '#0a0a0f' }]}>
          <TouchableOpacity
            onPress={() => setFullPlayerVisible(false)}
            style={styles.closeFullBtn}
          >
            <Text style={styles.closeFullText}>✕</Text>
          </TouchableOpacity>

          {currentSong && (
            <View style={styles.fullPlayerContent}>
              <Image source={{ uri: currentSong.thumbnail }} style={styles.fullArtwork} />
              <Text numberOfLines={1} style={styles.fullTitle}>{currentSong.title}</Text>
              <Text numberOfLines={1} style={styles.fullArtist}>{currentSong.artist}</Text>

              <View style={styles.fullControls}>
                <TouchableOpacity onPress={skipPrevious} style={styles.fullCtrlBtn}>
                  <Text style={{ fontSize: 28 }}>⏮️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={togglePlayPause} style={styles.fullPlayBtn}>
                  <Text style={{ fontSize: 36 }}>{isPlaying ? '⏸️' : '▶️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={skipNext} style={styles.fullCtrlBtn}>
                  <Text style={{ fontSize: 28 }}>⏭️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  brandTagline: { color: '#a1a1aa', fontSize: 12, fontWeight: '500' },
  quickMixButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quickMixText: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionHeader: { marginVertical: 12 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { color: '#71717a', fontSize: 12 },
  vibesScroll: { marginBottom: 16 },
  vibeCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  vibeEmoji: { fontSize: 24, marginBottom: 4 },
  vibeName: { color: '#d4d4d8', fontSize: 12, fontWeight: '600' },
  vibeBanner: {
    backgroundColor: '#181820',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vibeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  activeVibeTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  activeVibeDesc: { color: '#a1a1aa', fontSize: 11 },
  playVibeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  playVibeText: { color: '#09090b', fontSize: 12, fontWeight: '700' },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  trackThumbnail: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  trackInfo: { flex: 1 },
  trackTitle: { color: '#f4f4f5', fontSize: 14, fontWeight: '600' },
  trackArtist: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  favButton: { padding: 8 },
  searchBoxContainer: { marginVertical: 12 },
  searchInput: {
    backgroundColor: '#18181b',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  libraryHeader: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginVertical: 12 },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121218',
    padding: 10,
    borderTopWidth: 2,
  },
  miniThumbnail: { width: 42, height: 42, borderRadius: 6, marginRight: 10 },
  miniInfo: { flex: 1 },
  miniTitle: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  miniArtist: { color: '#a1a1aa', fontSize: 11 },
  controlBtn: { padding: 6 },
  controlIcon: { fontSize: 20 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#09090b',
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingVertical: 10,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { color: '#71717a', fontSize: 12, fontWeight: '600' },
  fullPlayerContainer: { flex: 1, padding: 20 },
  closeFullBtn: { alignSelf: 'flex-start', padding: 10 },
  closeFullText: { color: '#ffffff', fontSize: 22 },
  fullPlayerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullArtwork: { width: width - 80, height: width - 80, borderRadius: 24, marginBottom: 24 },
  fullTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  fullArtist: { color: '#a1a1aa', fontSize: 15, marginTop: 6, textAlign: 'center' },
  fullControls: { flexDirection: 'row', alignItems: 'center', marginTop: 36, gap: 24 },
  fullCtrlBtn: { padding: 12 },
  fullPlayBtn: { padding: 16, backgroundColor: '#27272a', borderRadius: 50 },
});
