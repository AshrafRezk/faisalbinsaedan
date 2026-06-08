import { useEffect, useState, useRef } from 'react'
import { Box, Container, Typography, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { detectVideoAspectRatio } from '../../lib/api-client'
import { useHomePageContent } from '../../contexts/HomePageContentContext'
import type { HeroVideoContent } from '../../lib/home-page-content'
import VideoCover from './VideoCover'

// Type declaration for Instagram embed API
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}

export default function HeroSection() {
  const { t } = useTranslation()
  const { content, isLoading: isContentLoading, text } = useHomePageContent()
  const [featuredVideo, setFeaturedVideo] = useState<HeroVideoContent | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const isLoading = isContentLoading
  const [instagramEmbedFailed, setInstagramEmbedFailed] = useState(false)
  const [showFallback, setShowFallback] = useState(true)
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 5)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function applyHeroVideo() {
      const videoData = content.hero.video
      if (!videoData?.videoUrl) {
        setFeaturedVideo(null)
        return
      }

      try {
        let finalAspectRatio = videoData.aspectRatio
        if (finalAspectRatio) {
          setAspectRatio(finalAspectRatio)
        } else {
          const isNativeVideo =
            /\.(mp4|webm|ogg|m3u8|mov|avi)(\?|$)/i.test(videoData.videoUrl) ||
            videoData.videoUrl.startsWith('blob:') ||
            videoData.videoUrl.startsWith('data:video/')
          if (isNativeVideo) {
            try {
              const detectedRatio = await detectVideoAspectRatio(videoData.videoUrl)
              if (detectedRatio) {
                finalAspectRatio = detectedRatio
                setAspectRatio(detectedRatio)
              }
            } catch {
              setAspectRatio(4 / 5)
            }
          } else if (videoData.videoUrl.includes('instagram.com/reel/')) {
            setAspectRatio(9 / 16)
          } else if (videoData.videoUrl.includes('instagram.com/p/')) {
            setAspectRatio(1)
          } else {
            setAspectRatio(4 / 5)
          }
        }
        setFeaturedVideo({ ...videoData, aspectRatio: finalAspectRatio })
        setIsVideoPlaying(true)
      } catch (error) {
        console.error('Error applying hero video:', error)
      }
    }

    if (!isContentLoading) {
      applyHeroVideo()
    }
  }, [content.hero.video, isContentLoading])

  useEffect(() => {
    if (featuredVideo?.videoUrl?.includes('instagram.com')) {
      setInstagramEmbedFailed(false)
      if (window.instgrm) {
        window.instgrm.Embeds.process()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => {
        setTimeout(() => {
          if (window.instgrm) {
            window.instgrm.Embeds.process()
          } else {
            setInstagramEmbedFailed(true)
          }
        }, 100)
      }
      script.onerror = () => setInstagramEmbedFailed(true)
      const timeout = setTimeout(() => {
        if (!window.instgrm) setInstagramEmbedFailed(true)
      }, 3000)
      document.body.appendChild(script)
      return () => {
        clearTimeout(timeout)
        const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]')
        if (existingScript && existingScript.parentNode) {
          existingScript.parentNode.removeChild(existingScript)
        }
      }
    }
  }, [featuredVideo])

  const scrollToProjects = () => {
    const target = document.getElementById('inspiring-spaces')
    if (!target) return
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset
    const startPosition = window.pageYOffset
    const distance = targetPosition - startPosition
    const duration = 1500 // 1.5 seconds slow animated scroll
    let start: number | null = null

    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime
      const timeElapsed = currentTime - start
      const progress = Math.min(timeElapsed / duration, 1)
      const ease = easeInOutCubic(progress)
      window.scrollTo(0, startPosition + distance * ease)
      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      }
    }
    requestAnimationFrame(animation)
  }

  const renderVideo = () => {
    if (!featuredVideo || !featuredVideo.videoUrl || isLoading) {
      return (
        <VideoCover aspectRatio={aspectRatio} mediaType="video">
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: featuredVideo?.coverImageUrl 
                ? `url(${featuredVideo.coverImageUrl}) center/cover` 
                : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </VideoCover>
      )
    }

    if (featuredVideo.videoUrl.includes('instagram.com')) {
      if (instagramEmbedFailed) {
        return (
          <Box
            component="a"
            href={featuredVideo.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              background: featuredVideo.coverImageUrl ? `url(${featuredVideo.coverImageUrl})` : '#e2e8f0',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center', color: 'white', p: 2, bgcolor: 'rgba(0, 0, 0, 0.5)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
              <Typography variant="body1" fontWeight="bold">{t('home.watchOnInstagram', 'Watch video on Instagram')}</Typography>
            </Box>
          </Box>
        )
      }
      return (
        <VideoCover aspectRatio={aspectRatio} mediaType="instagram">
          <Box
            component="blockquote"
            className="instagram-media"
            data-instgrm-permalink={featuredVideo.videoUrl}
            data-instgrm-version="14"
            sx={{ width: '100%', height: '100%', m: 0, p: 0, display: 'block', '& iframe': { width: '100% !important', height: '100% !important', border: 'none' } }}
          />
        </VideoCover>
      )
    }

    const isNativeVideo = /\.(mp4|webm|ogg|m3u8|mov|avi)(\?|$)/i.test(featuredVideo.videoUrl) ||
                          featuredVideo.videoUrl.startsWith('blob:') ||
                          featuredVideo.videoUrl.startsWith('data:video/')
    
    if (isNativeVideo) {
      return (
        <VideoCover aspectRatio={aspectRatio} mediaType="video">
          <video
            ref={videoRef}
            src={featuredVideo.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            onLoadedMetadata={() => {
              if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
                const detectedRatio = videoRef.current.videoWidth / videoRef.current.videoHeight
                if (Math.abs(detectedRatio - aspectRatio) > 0.01) {
                  setAspectRatio(detectedRatio)
                }
              }
              setIsVideoPlaying(true)
            }}
            onPlay={() => setIsVideoPlaying(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </VideoCover>
      )
    }

    let finalIframeUrl = featuredVideo.videoUrl.trim()
    const separator = finalIframeUrl.includes('?') ? '&' : '?'
    if (!finalIframeUrl.includes('autoplay=')) {
      finalIframeUrl += `${separator}autoplay=1&mute=1&playsinline=1`
    }
    if (finalIframeUrl.includes('youtube.com') || finalIframeUrl.includes('youtu.be')) {
      if (!finalIframeUrl.includes('controls=')) {
        finalIframeUrl += '&controls=0'
      }
      if (!finalIframeUrl.includes('loop=')) {
        finalIframeUrl += '&loop=1'
      }
    }

    return (
      <VideoCover aspectRatio={aspectRatio} mediaType="iframe">
        <Box
          component="iframe"
          src={finalIframeUrl}
          onLoad={() => {
            setTimeout(() => setIsVideoPlaying(true), 500)
          }}
          sx={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', display: 'block' }}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="eager"
        />
      </VideoCover>
    )
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', pt: { xs: 10, md: 12 }, pb: { xs: 8, md: 4 } }}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 10, px: { xs: 2, md: 4, lg: 6 }, height: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
        
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: { xs: 8, md: 4, lg: 8 },
          my: { xs: 8, md: 10 } 
        }}>
          
          {/* Main Title & Description */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 4, md: 6 }, flex: 1, zIndex: 10, maxWidth: { xs: '100%', md: '50%' } }}>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '3rem', sm: '4rem', md: '4rem', lg: '5rem' },
                  fontWeight: 400,
                  color: '#102d4a',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.6)',
                }}
              >
                {text(content.hero.titleLine1)}
                <br />
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}>
              <Typography
                variant="body1"
                sx={{
                  color: '#102d4a',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  maxWidth: '400px'
                }}
              >
                {text(content.hero.description)}
              </Typography>
            </motion.div>
          </Box>

          {/* Center Square Video Container */}
          <Box sx={{ width: { xs: '100%', sm: '80%', md: '450px', lg: '550px' }, aspectRatio: '1/1', position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: 'easeOut' }} style={{ width: '100%', height: '100%' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 0, // Sharp corners
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  position: 'relative',
                  bgcolor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& > *': { width: '100%', height: '100%' }
                }}
              >
                {/* Fallback Video (Fades out when Salesforce video plays or when it finishes) */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    opacity: showFallback && !isVideoPlaying ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    pointerEvents: 'none',
                    '& > *': { width: '100%', height: '100%' }
                  }}
                >
                  <VideoCover aspectRatio={1} mediaType="video">
                    <video
                      src={content.hero.fallbackVideoUrl}
                      autoPlay
                      muted
                      playsInline
                      loop={!featuredVideo}
                      onEnded={() => setShowFallback(false)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </VideoCover>
                </Box>

                {/* Main Video Component (Fades in) */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    opacity: isVideoPlaying ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    '& > *': { width: '100%', height: '100%' }
                  }}
                >
                  {renderVideo()}
                </Box>

                {/* Underlay Cover Image */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    background: featuredVideo?.coverImageUrl 
                      ? `url(${featuredVideo.coverImageUrl}) center/cover` 
                      : 'linear-gradient(135deg, #102d4a 0%, #1e4670 100%)',
                  }}
                />
              </Box>
            </motion.div>
          </Box>
        </Box>

        {/* Scroll Down Section */}
        <Box sx={{ position: 'absolute', bottom: { xs: 10, md: 30 }, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#102d4a' }} onClick={scrollToProjects}>
            <Typography variant="body2" fontWeight="500" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
              <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} style={{ display: 'inline-block' }}>
                <ChevronDown size={32} />
              </motion.span>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
