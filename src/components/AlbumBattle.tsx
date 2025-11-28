import React, { useState, useEffect } from 'react';
import { Album, getNextBattle, recordBattle } from '../services/localAlbumService';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';

interface AlbumBattleProps {
  onBattleComplete: () => void;
}

export default function AlbumBattle({ onBattleComplete }: AlbumBattleProps) {
  const [currentBattle, setCurrentBattle] = useState<[Album, Album] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [battleResult, setBattleResult] = useState<{
    winner: Album | null;
    loser: Album | null;
    isDraw: boolean;
    completed: boolean;
  } | null>(null);

  // Load the next battle when component mounts
  useEffect(() => {
    loadNextBattle();
  }, []);

  const loadNextBattle = () => {
    setLoading(true);
    try {
      const nextBattle = getNextBattle();
      setCurrentBattle(nextBattle);
      setBattleResult(null);
    } catch (err) {
      console.error('Error loading next battle:', err);
      setError('Failed to load the next battle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = (winnerId: string | null) => {
    if (!currentBattle) return;

    try {
      const [album1, album2] = currentBattle;

      // Record the battle result
      const result = recordBattle(album1.id, album2.id, winnerId);

      // Set the battle result for display
      setBattleResult({
        winner: result.winner,
        loser: result.loser,
        isDraw: result.isDraw,
        completed: true,
      });

      // Show appropriate message
      if (result.isDraw) {
        setMessage(`It's a draw! Both albums get 1 point.`);
      } else if (result.winner) {
        setMessage(`${result.winner.title} wins! +3 points`);
      }

      // Notify parent component that a battle has been completed
      onBattleComplete();
    } catch (err) {
      console.error('Error recording battle result:', err);
      if (err instanceof Error) {
        setError(`Failed to record battle result: ${err.message}`);
      } else {
        setError('Failed to record battle result. Please try again.');
      }
    }
  };

  const handleNextBattle = () => {
    loadNextBattle();
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  const handleCloseError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">Loading next battle...</Typography>
      </Box>
    );
  }

  if (!currentBattle) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h2" component="h2" gutterBottom>
          Album Battles
        </Typography>
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            All battles completed!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You've completed all possible album battles. Check the rankings to see the final
            results!
          </Typography>
        </Paper>
      </Box>
    );
  }

  const [album1, album2] = currentBattle;

  return (
    <Box>
      <Typography variant="h2" component="h2" gutterBottom>
        Album Battle
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Which album do you prefer? Select a winner or declare a draw.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
        {/* Album 1 */}
        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              transform: battleResult?.winner?.id === album1.id ? 'scale(1.05)' : 'scale(1)',
              border: battleResult?.winner?.id === album1.id ? '2px solid' : 'none',
              borderColor: 'primary.main',
              opacity: battleResult?.loser?.id === album1.id ? 0.7 : 1,
            }}
          >
            <CardMedia
              component="img"
              sx={{
                height: 250,
                objectFit: 'contain',
                bgcolor: 'black',
                p: 2,
              }}
              image={album1.coverArtUrl || 'https://via.placeholder.com/300?text=No+Cover'}
              alt={`${album1.title} cover`}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Cover';
              }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="div" gutterBottom>
                {album1.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {album1.artist}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {album1.releaseYear}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Chip label={`Rank: ${album1.rank}`} color="primary" size="small" sx={{ mr: 1 }} />
                <Chip label={`Points: ${album1.points}`} color="secondary" size="small" />
              </Box>
            </CardContent>

            {!battleResult && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => handleSelectWinner(album1.id)}
                sx={{ m: 2 }}
              >
                Select Winner
              </Button>
            )}
          </Card>
        </Box>

        {/* VS or Result */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: '100%', md: '100px' },
            py: { xs: 2, md: 0 },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            {battleResult ? (
              battleResult.isDraw ? (
                <Box>
                  <HandshakeIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                  <Typography variant="h6">DRAW</Typography>
                  <Typography variant="body2" color="text.secondary">
                    +1 point each
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <EmojiEventsIcon sx={{ fontSize: 60, color: 'warning.main' }} />
                  <Typography variant="h6">WINNER</Typography>
                  <Typography variant="body2" color="text.secondary">
                    +3 points
                  </Typography>
                </Box>
              )
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                VS
              </Typography>
            )}
          </Box>
        </Box>

        {/* Album 2 */}
        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              transform: battleResult?.winner?.id === album2.id ? 'scale(1.05)' : 'scale(1)',
              border: battleResult?.winner?.id === album2.id ? '2px solid' : 'none',
              borderColor: 'primary.main',
              opacity: battleResult?.loser?.id === album2.id ? 0.7 : 1,
            }}
          >
            <CardMedia
              component="img"
              sx={{
                height: 250,
                objectFit: 'contain',
                bgcolor: 'black',
                p: 2,
              }}
              image={album2.coverArtUrl || 'https://via.placeholder.com/300?text=No+Cover'}
              alt={`${album2.title} cover`}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Cover';
              }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="div" gutterBottom>
                {album2.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {album2.artist}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {album2.releaseYear}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Chip label={`Rank: ${album2.rank}`} color="primary" size="small" sx={{ mr: 1 }} />
                <Chip label={`Points: ${album2.points}`} color="secondary" size="small" />
              </Box>
            </CardContent>

            {!battleResult && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => handleSelectWinner(album2.id)}
                sx={{ m: 2 }}
              >
                Select Winner
              </Button>
            )}
          </Card>
        </Box>
      </Box>

      {/* Draw button and Next battle button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        {!battleResult ? (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={() => handleSelectWinner(null)}
          >
            Declare Draw
          </Button>
        ) : (
          <Button variant="contained" color="primary" size="large" onClick={handleNextBattle}>
            Next Battle
          </Button>
        )}
      </Box>

      {/* Success message */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseMessage}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>

      {/* Error message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" variant="filled" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
