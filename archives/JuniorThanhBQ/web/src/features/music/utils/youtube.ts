const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'music.youtube.com',
])

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  const trimmed = input.trim()

  if (trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
    if (srcMatch && srcMatch[1]) {
      return extractYouTubeVideoId(srcMatch[1])
    }
    return null
  }

  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed
  }

  try {
    let urlString = trimmed
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = `https://${urlString}`
    }

    const parsed = new URL(urlString)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')

    const isValidHost = Array.from(YOUTUBE_HOSTS).some(
      host => hostname === host.replace(/^www\./, '')
    )

    if (!isValidHost) {
      return null
    }

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return VIDEO_ID_REGEX.test(id) ? id : null
    }

    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0]
      return id && VIDEO_ID_REGEX.test(id) ? id : null
    }

    if (parsed.pathname.startsWith('/embed/')) {
      const id = parsed.pathname.split('/embed/')[1]?.split('/')[0]
      return id && VIDEO_ID_REGEX.test(id) ? id : null
    }

    const vParam = parsed.searchParams.get('v')
    if (vParam && VIDEO_ID_REGEX.test(vParam)) {
      return vParam
    }

    return null
  } catch {
    return null
  }
}

export function buildSafeYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
}
