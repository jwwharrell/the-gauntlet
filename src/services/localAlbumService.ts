import { AlbumSearchResult } from './musicbrainzApi';

// Define the Album type
export interface Album {
  id: string;
  title: string;
  artist: string;
  releaseYear: string;
  coverArtUrl: string | null;
  mbid: string;
  rank: number;
  points: number;
  battledWith: string[]; // Array of album IDs this album has battled with
}

// Define the Battle result type
export interface BattleResult {
  winner: Album | null; // null means draw
  loser: Album | null; // null means draw
  isDraw: boolean;
  winnerPoints: number;
  loserPoints: number;
}

// Key for localStorage
const ALBUMS_STORAGE_KEY = 'ranked_albums';

/**
 * Get all albums from localStorage
 */
export const getAlbums = (): Album[] => {
  try {
    const storedAlbums = localStorage.getItem(ALBUMS_STORAGE_KEY);
    const albums = storedAlbums ? JSON.parse(storedAlbums) : [];

    // Ensure all albums have the required properties and sort by points
    const updatedAlbums = albums.map((album: any) => ({
      ...album,
      points: album.points !== undefined ? album.points : 0,
      battledWith: album.battledWith || [],
    }));

    // Sort albums by points (descending)
    updatedAlbums.sort((a: Album, b: Album) => b.points - a.points);

    // Update ranks based on points
    updatedAlbums.forEach((album: Album, index: number) => {
      album.rank = index + 1;
    });

    return updatedAlbums;
  } catch (error) {
    console.error('Error retrieving albums from localStorage:', error);
    return [];
  }
};

/**
 * Add a new album to the ranking
 */
export const addAlbum = (albumData: AlbumSearchResult): Album => {
  try {
    const albums = getAlbums();

    // Check if album already exists
    const existingAlbum = albums.find(album => album.mbid === albumData.id);
    if (existingAlbum) {
      throw new Error(`Album "${albumData.title}" is already in your ranking.`);
    }

    // Get the highest rank
    const highestRank = albums.length > 0 ? Math.max(...albums.map(a => a.rank)) : 0;

    // Create new album
    const newAlbum: Album = {
      id: `album_${Date.now()}`, // Generate a unique ID
      title: albumData.title,
      artist: albumData.artist,
      releaseYear: albumData.releaseYear,
      coverArtUrl: albumData.coverArtUrl,
      mbid: albumData.id,
      rank: highestRank + 1,
      points: 0,
      battledWith: [],
    };

    // Add to list and save
    albums.push(newAlbum);
    localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));

    return newAlbum;
  } catch (error) {
    console.error('Error adding album to localStorage:', error);
    throw error;
  }
};

/**
 * Update an album's rank
 */
export const updateAlbumRank = (albumId: string, newRank: number): Album => {
  try {
    const albums = getAlbums();
    const albumIndex = albums.findIndex(album => album.id === albumId);

    if (albumIndex === -1) {
      throw new Error('Album not found');
    }

    const album = albums[albumIndex];
    const oldRank = album.rank;

    // Update ranks for all affected albums
    if (oldRank < newRank) {
      // Moving down the list
      albums.forEach(a => {
        if (a.rank > oldRank && a.rank <= newRank) {
          a.rank--;
        }
      });
    } else if (oldRank > newRank) {
      // Moving up the list
      albums.forEach(a => {
        if (a.rank >= newRank && a.rank < oldRank) {
          a.rank++;
        }
      });
    }

    // Update the album's rank
    album.rank = newRank;

    // Save changes
    localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));

    return album;
  } catch (error) {
    console.error('Error updating album rank in localStorage:', error);
    throw error;
  }
};

/**
 * Delete an album from the ranking
 */
export const deleteAlbum = (albumId: string): void => {
  try {
    const albums = getAlbums();
    const albumIndex = albums.findIndex(album => album.id === albumId);

    if (albumIndex === -1) {
      throw new Error('Album not found');
    }

    const deletedAlbum = albums[albumIndex];

    // Remove the album
    albums.splice(albumIndex, 1);

    // Update ranks for all albums with higher ranks
    albums.forEach(album => {
      if (album.rank > deletedAlbum.rank) {
        album.rank--;
      }
    });

    // Save changes
    localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));
  } catch (error) {
    console.error('Error deleting album from localStorage:', error);
    throw error;
  }
};

/**
 * Record a battle between two albums
 * @param album1Id First album ID
 * @param album2Id Second album ID
 * @param winnerId ID of the winning album (or null for a draw)
 * @returns Battle result
 */
export const recordBattle = (
  album1Id: string,
  album2Id: string,
  winnerId: string | null
): BattleResult => {
  try {
    const albums = getAlbums();
    const album1Index = albums.findIndex(album => album.id === album1Id);
    const album2Index = albums.findIndex(album => album.id === album2Id);

    if (album1Index === -1 || album2Index === -1) {
      throw new Error('One or both albums not found');
    }

    const album1 = albums[album1Index];
    const album2 = albums[album2Index];

    // Initialize battledWith arrays if they don't exist
    if (!album1.battledWith) {
      album1.battledWith = [];
    }
    if (!album2.battledWith) {
      album2.battledWith = [];
    }

    // Initialize points if they don't exist
    if (album1.points === undefined) {
      album1.points = 0;
    }
    if (album2.points === undefined) {
      album2.points = 0;
    }

    // Check if these albums have already battled
    if (album1.battledWith.includes(album2.id)) {
      throw new Error(`${album1.title} has already battled with ${album2.title}`);
    }

    // Record that these albums have battled each other
    album1.battledWith.push(album2.id);
    album2.battledWith.push(album1.id);

    let result: BattleResult;

    // Handle the battle result
    if (winnerId === null) {
      // It's a draw - both get 1 point
      album1.points += 1;
      album2.points += 1;
      result = {
        winner: null,
        loser: null,
        isDraw: true,
        winnerPoints: 1,
        loserPoints: 1,
      };
    } else if (winnerId === album1.id) {
      // Album 1 wins - gets 3 points
      album1.points += 3;
      result = {
        winner: album1,
        loser: album2,
        isDraw: false,
        winnerPoints: 3,
        loserPoints: 0,
      };
    } else if (winnerId === album2.id) {
      // Album 2 wins - gets 3 points
      album2.points += 3;
      result = {
        winner: album2,
        loser: album1,
        isDraw: false,
        winnerPoints: 3,
        loserPoints: 0,
      };
    } else {
      throw new Error('Invalid winner ID');
    }

    // Sort albums by points (descending) and update ranks
    albums.sort((a: Album, b: Album) => b.points - a.points);
    albums.forEach((album: Album, index: number) => {
      album.rank = index + 1;
    });

    // Save changes
    localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));

    return result;
  } catch (error) {
    console.error('Error recording battle in localStorage:', error);
    throw error;
  }
};

/**
 * Get all possible battles (pairs of albums that haven't battled yet)
 * @returns Array of album pairs that haven't battled
 */
export const getPossibleBattles = (): [Album, Album][] => {
  const albums = getAlbums();
  const possibleBattles: [Album, Album][] = [];

  // Check all possible pairs
  for (let i = 0; i < albums.length; i++) {
    for (let j = i + 1; j < albums.length; j++) {
      // Initialize battledWith array if it doesn't exist
      if (!albums[i].battledWith) {
        albums[i].battledWith = [];
      }
      if (!albums[j].battledWith) {
        albums[j].battledWith = [];
      }

      // If these albums haven't battled yet, add them as a possible battle
      if (!albums[i].battledWith.includes(albums[j].id)) {
        possibleBattles.push([albums[i], albums[j]]);
      }
    }
  }

  return possibleBattles;
};

/**
 * Get the next battle (first pair of albums that haven't battled yet)
 * @returns Next battle or null if no battles remain
 */
export const getNextBattle = (): [Album, Album] | null => {
  const possibleBattles = getPossibleBattles();
  return possibleBattles.length > 0 ? possibleBattles[0] : null;
};

/**
 * Reorder albums by dragging
 */
export const reorderAlbums = (draggedId: string, targetId: string): Album[] => {
  try {
    const albums = getAlbums();
    const draggedIndex = albums.findIndex(album => album.id === draggedId);
    const targetIndex = albums.findIndex(album => album.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      throw new Error('Album not found');
    }

    const targetAlbum = albums[targetIndex];

    // Update the dragged album's rank to match the target
    updateAlbumRank(draggedId, targetAlbum.rank);

    // Get the updated albums
    return getAlbums();
  } catch (error) {
    console.error('Error reordering albums in localStorage:', error);
    throw error;
  }
};
