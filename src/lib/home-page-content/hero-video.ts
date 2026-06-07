import type { HeroVideoContent, PWAContentRecord } from './types'

export function processHeroVideoFromRecord(content: PWAContentRecord): HeroVideoContent | null {
  let videoUrl = (content.Content_URL__c || '').trim()
  if (!videoUrl) return null

  let aspectRatio: number | undefined
  if (content.Aspect_Ratio__c) {
    const ratioMatch = content.Aspect_Ratio__c.match(/(\d+):(\d+)/)
    if (ratioMatch) {
      aspectRatio = parseFloat(ratioMatch[1]) / parseFloat(ratioMatch[2])
    }
  }

  if (videoUrl.includes('instagram.com/reel/') || videoUrl.includes('instagram.com/p/')) {
    videoUrl = videoUrl.split('?')[0]
  } else if (videoUrl.includes('drive.google.com')) {
    const fileIdMatch = videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    const openIdMatch = videoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    const ucIdMatch = videoUrl.match(/\/uc\?id=([a-zA-Z0-9_-]+)/)
    const fileId = fileIdMatch?.[1] || openIdMatch?.[1] || ucIdMatch?.[1] || ''
    if (fileId) {
      videoUrl = `https://drive.google.com/file/d/${fileId}/preview?autoplay=1&mute=1`
    }
  } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = ''
    if (videoUrl.includes('youtube.com/watch')) {
      videoId = videoUrl.match(/[?&]v=([^&]+)/)?.[1] || ''
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.match(/youtu\.be\/([^/?&]+)/)?.[1] || ''
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.match(/embed\/([^?&]+)/)?.[1] || ''
    }
    if (videoId) {
      const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: videoId,
        controls: '0',
        showinfo: '0',
        playsinline: '1',
        enablejsapi: '1',
        rel: '0',
        modestbranding: '1',
      })
      videoUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`
    }
  }

  let coverImageUrl = ''
  if (videoUrl.includes('youtube.com/embed/')) {
    const thumbVideoId = videoUrl.match(/embed\/([^?]+)/)?.[1]
    if (thumbVideoId) {
      coverImageUrl = `https://img.youtube.com/vi/${thumbVideoId}/maxresdefault.jpg`
    }
  }

  return {
    projectId: '',
    projectName: content.Name,
    projectNameAr: content.Name,
    videoUrl,
    coverImageUrl,
    aspectRatio,
  }
}
