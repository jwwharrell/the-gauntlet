import { useState, useEffect } from 'react';
import AlbumSearch from './components/AlbumSearch';
import AlbumRanking from './components/AlbumRanking';
import AlbumBattle from './components/AlbumBattle';
import { AlbumSearchResult } from './services/musicbrainzApi';
import { getAlbums, addAlbum, Album, getPossibleBattles } from './services/localAlbumService';
import {
  Container,
  Box,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
} from '@mui/material';

// No longer using Amplify client for album operations

// Create a theme instance with a dark mode preference
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6c5ce7',
    },
    secondary: {
      main: '#a29bfe',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      marginBottom: '1.5rem',
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 600,
      marginBottom: '1rem',
    },
    h3: {
      fontSize: '1.4rem',
      fontWeight: 500,
      marginBottom: '0.8rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

export default function App() {
  const [rankedAlbums, setRankedAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'search' | 'battle' | 'ranking'>('search');
  const [hasPossibleBattles, setHasPossibleBattles] = useState(false);

  // Fetch ranked albums on component mount
  useEffect(() => {
    fetchRankedAlbums();
  }, []);

  // Check for possible battles whenever rankedAlbums changes
  useEffect(() => {
    if (rankedAlbums.length >= 2) {
      const battles = getPossibleBattles();
      setHasPossibleBattles(battles.length > 0);
    } else {
      setHasPossibleBattles(false);
    }
  }, [rankedAlbums]);

  // Function to fetch ranked albums from localStorage
  const fetchRankedAlbums = () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get albums from localStorage
      const albums = getAlbums();
      console.log('Fetched albums from localStorage:', albums);

      // Sort albums by rank (already sorted in getAlbums, but just to be sure)
      albums.sort((a, b) => a.rank - b.rank);
      console.log('Sorted albums:', albums);

      setRankedAlbums(albums);
    } catch (err) {
      console.error('Error fetching ranked albums:', err);
      // Show more specific error message
      if (err instanceof Error) {
        setError(`Failed to load albums: ${err.message}`);
      } else {
        setError('Failed to load your ranked albums. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle adding a new album to the ranking
  const handleAddAlbum = (album: AlbumSearchResult) => {
    setIsLoading(true);
    setError(null);
    try {
      // Add album to localStorage
      const newAlbum = addAlbum(album);
      console.log('Added new album:', newAlbum);

      // Refresh the list
      fetchRankedAlbums();
      setSuccessMessage(`Added "${album.title}" to your ranking!`);
    } catch (err) {
      console.error('Error adding album:', err);
      // Show more specific error message
      if (err instanceof Error) {
        setError(`Failed to add album: ${err.message}`);
      } else {
        setError('Failed to add album to your ranking. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h1" component="h1">
            The Gauntlet
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Search for your favorite albums and create your personal ranking
          </Typography>

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button
              variant={activeView === 'search' ? 'contained' : 'outlined'}
              onClick={() => setActiveView('search')}
            >
              Search
            </Button>

            <Button
              variant={activeView === 'battle' ? 'contained' : 'outlined'}
              onClick={() => setActiveView('battle')}
              disabled={!hasPossibleBattles}
            >
              Battle ({hasPossibleBattles ? 'Available' : 'None'})
            </Button>

            <Button
              variant={activeView === 'ranking' ? 'contained' : 'outlined'}
              onClick={() => setActiveView('ranking')}
            >
              Rankings
            </Button>
          </Box>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Main content based on active view */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeView === 'search' && <AlbumSearch onAlbumSelect={handleAddAlbum} />}

          {activeView === 'battle' && <AlbumBattle onBattleComplete={fetchRankedAlbums} />}

          {activeView === 'ranking' && (
            <AlbumRanking rankedAlbums={rankedAlbums} onRefresh={fetchRankedAlbums} />
          )}
        </Paper>

        {/* Success message */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={handleCloseSuccessMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSuccessMessage}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>

        {/* Error message */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseError}
            severity="error"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}
