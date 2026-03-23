import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { getMyProgress, getVideos, saveMyProgress } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function toDriveStreamUrl(video) {
  if (video?.streamUrl) {
    return video.streamUrl;
  }

  if (video?.driveFileId) {
    return `https://drive.google.com/uc?export=download&id=${video.driveFileId}`;
  }

  return '';
}

export default function VideoPlayerPage() {
  const { user, logout } = useAuth();
  const playerRef = useRef(null);
  const lastSyncedRef = useRef(0);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [statusText, setStatusText] = useState('');

  const videoUrl = useMemo(() => toDriveStreamUrl(video), [video]);
  const completion = useMemo(() => {
    if (!durationSeconds || durationSeconds <= 0) {
      return 0;
    }
    return Math.min(100, (watchedSeconds / durationSeconds) * 100);
  }, [durationSeconds, watchedSeconds]);

  const saveProgress = useCallback(
    async (force = false) => {
      if (!video?.id || !playerRef.current) {
        return;
      }

      const currentTime = playerRef.current.currentTime || 0;
      const totalDuration = playerRef.current.duration || durationSeconds || 0;

      if (!force && Math.abs(currentTime - lastSyncedRef.current) < 5) {
        return;
      }

      try {
        await saveMyProgress({
          videoId: video.id,
          watchedSeconds: Number(currentTime.toFixed(2)),
          durationSeconds: Number(totalDuration.toFixed(2)),
        });

        lastSyncedRef.current = currentTime;
        setStatusText(`Progress synced at ${new Date().toLocaleTimeString()}`);
      } catch (requestError) {
        setStatusText('Could not sync progress right now.');
      }
    },
    [durationSeconds, video?.id]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setLoading(true);
      setError('');

      try {
        const videos = await getVideos();
        const firstVideo = videos[0];
        if (!firstVideo) {
          throw new Error('No video found. Add one in Strapi admin first.');
        }

        const progress = await getMyProgress(firstVideo.id);

        if (!isMounted) {
          return;
        }

        setVideo(firstVideo);
        setWatchedSeconds(Number(progress?.watchedSeconds || 0));
        setDurationSeconds(Number(progress?.durationSeconds || firstVideo.durationSeconds || 0));
        lastSyncedRef.current = Number(progress?.watchedSeconds || 0);
      } catch (requestError) {
        const message =
          requestError?.response?.data?.error?.message || requestError?.message || 'Failed to load video.';
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current || watchedSeconds <= 0) {
      return;
    }

    playerRef.current.currentTime = watchedSeconds;
  }, [watchedSeconds, video?.id]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void saveProgress(false);
    }, 15000);

    return () => {
      clearInterval(intervalId);
      void saveProgress(true);
    };
  }, [saveProgress]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Typography>Loading your session...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f8fb' }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700}>Video Session</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {user?.username || user?.email}
            </Typography>
            <Button color="error" variant="outlined" onClick={logout}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {video?.title}
          </Typography>
          {video?.description ? (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {video.description}
            </Typography>
          ) : null}

          {videoUrl ? (
            <Box
              component="video"
              ref={playerRef}
              controls
              src={videoUrl}
              onLoadedMetadata={(event) => {
                const total = Number(event.currentTarget.duration || 0);
                if (total > 0) {
                  setDurationSeconds(total);
                }
                if (watchedSeconds > 0) {
                  event.currentTarget.currentTime = watchedSeconds;
                }
              }}
              onTimeUpdate={(event) => {
                setWatchedSeconds(event.currentTarget.currentTime || 0);
                void saveProgress(false);
              }}
              onPause={() => {
                void saveProgress(true);
              }}
              onEnded={() => {
                setWatchedSeconds(durationSeconds || 0);
                void saveProgress(true);
              }}
              sx={{
                width: '100%',
                borderRadius: 2,
                backgroundColor: '#000',
                mb: 2,
              }}
            />
          ) : (
            <Alert severity="warning">No stream URL configured for this video.</Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Watched: {Math.floor(watchedSeconds)}s / {Math.floor(durationSeconds || 0)}s
          </Typography>
          <LinearProgress variant="determinate" value={completion} sx={{ height: 8, borderRadius: 99 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {completion.toFixed(1)}% complete
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {statusText}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
