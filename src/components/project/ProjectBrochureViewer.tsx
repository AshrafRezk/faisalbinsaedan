import { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  CircularProgress,
  Typography,
  IconButton
} from '@mui/material';
import { Maximize, Minimize } from 'lucide-react';
import { Flipbook, setWorkerSrc } from 'flippy-pdf';
import 'flippy-pdf/style.css';
import workerUrl from 'flippy-pdf/worker?url';
import { useTranslation } from 'react-i18next';

// Set the worker source for PDF.js parsing
setWorkerSrc(workerUrl);

interface ProjectBrochureViewerProps {
  pdfUrl: string;
}

export default function ProjectBrochureViewer({ pdfUrl }: ProjectBrochureViewerProps) {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flipbookRef = useRef<Flipbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!containerRef.current || !pdfUrl) return;

    setIsLoading(true);
    setError(null);

    // Initialize Flipbook
    const fb = new Flipbook({ 
      container: containerRef.current,
      flipDuration: 800, // Slightly slower for more dramatic effect
      enableDrag: true,
      enableKeyboard: true
    });
    
    flipbookRef.current = fb;

    fb.load(pdfUrl)
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load PDF brochure:', err);
        setError(err.message || 'Failed to load brochure');
        setIsLoading(false);
      });

    return () => {
      fb.destroy();
      flipbookRef.current = null;
    };
  }, [pdfUrl]);

  return (
    <Box 
      ref={wrapperRef}
      dir="ltr"
      sx={{ 
        width: '100%', 
        height: isFullscreen ? '100vh' : { xs: 400, md: 600 },
        position: 'relative',
        bgcolor: '#ffffff',
        borderRadius: isFullscreen ? 0 : 4,
        overflow: 'hidden',
        boxShadow: isFullscreen ? 'none' : '0 4px 20px rgba(0,0,0,0.08)',
        direction: 'ltr',
        unicodeBidi: 'isolate',
      }}
    >
      {/* Top Toolbar */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100, 
        p: 2, 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, transparent 100%)',
        pointerEvents: 'none' // allow clicking through where empty
      }}>
        <Box sx={{ display: 'flex', gap: 1, pointerEvents: 'auto' }}>
          <IconButton onClick={toggleFullscreen} sx={{ color: 'text.primary', bgcolor: 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}>
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </IconButton>
        </Box>
      </Box>

      {/* Viewer Container */}
      <Box 
        ref={containerRef}
        dir="ltr"
        sx={{ 
          width: '100%', 
          height: '100%',
          bgcolor: 'transparent',
          direction: 'ltr',
          unicodeBidi: 'isolate',
          '& .ic-root': {
            direction: 'ltr',
          },
        }} 
      />

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#ffffff',
          zIndex: 50,
          color: 'text.primary'
        }}>
          <CircularProgress color="primary" size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" fontWeight="300">
            {t('project.loadingBrochure', 'Loading Interactive Brochure...')}
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#ffffff',
          zIndex: 50,
          color: 'text.primary'
        }}>
          <Typography variant="h6" color="error" gutterBottom>
            {t('project.errorLoadingBrochure', 'Failed to load brochure')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
