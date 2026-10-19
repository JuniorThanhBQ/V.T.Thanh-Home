import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ReactLenis, useLenis } from 'lenis/react'
import { Header } from './shared/components/headers/Header'
import { Footer } from './shared/components/footers/Footer'
import { ThemeProvider } from './contexts/theme-provider'
import { LoadingProvider } from './contexts/loading-provider'
import { LoadingScreen } from './shared/components/loading/LoadingScreen'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ReadingProgress } from './shared/components/ReadingProgress'
import { useChat, ChatToggle, ChatSidebar } from './features/chat'
import { useMusicPlayer, MusicPlayer } from './features/music'
import 'lenis/dist/lenis.css'

function LayoutContent() {
  const location = useLocation()
  const lenis = useLenis()
  const { isOpen, toggleChat, messages, inputText, setInputText, isTyping, sendMessage } = useChat()
  const music = useMusicPlayer()

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    }
  }, [location.pathname, lenis])

  return (
    <div className="flex flex-col min-h-screen">
      <ReadingProgress />
      <Header />
      <main className="flex-grow">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ChatToggle
        isOpen={isOpen}
        onClick={toggleChat}
        onMusicClick={music.openPlayer}
      />
      <ChatSidebar
        isOpen={isOpen}
        onClose={toggleChat}
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        isTyping={isTyping}
        onSendMessage={sendMessage}
      />
      <MusicPlayer
        isOpen={music.isOpen}
        isMinimized={music.isMinimized}
        currentVideoId={music.currentVideoId}
        inputUrl={music.inputUrl}
        error={music.error}
        setInputUrl={music.setInputUrl}
        onClose={music.closePlayer}
        onToggleMinimize={music.toggleMinimize}
        onLoadVideo={music.loadVideo}
      />
    </div>
  )
}

export function Layout() {
  return (
    <ReactLenis root>
      <ThemeProvider>
        <LoadingProvider>
          <LayoutContent />
          <LoadingScreen />
          <Analytics />
          <SpeedInsights />
        </LoadingProvider>
      </ThemeProvider>
    </ReactLenis>
  )
}
