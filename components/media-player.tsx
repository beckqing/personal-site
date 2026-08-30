'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Binary, CircleDot, Expand, Pause, Play } from 'lucide-react'
import { hasAnimation, hasSpeedpaint, isCodeDemo, speedpaintAspect, toneFor, type WorkItem, type WorkPiece } from '@/lib/work'
import { aspectStyleFor, WorkPlaceholder } from '@/components/work-visuals'
import { ImageLightbox } from '@/components/image-lightbox'
import { cn } from '@/lib/utils'

/**
 * Quiet indicators for a gallery tile carrying extra media — a speedpaint, a
 * finished animation, a runnable code demo, or (rarely) more than one at once.
 * Purely decorative: the tile's own link still does the navigating. Meant to
 * sit inside the same `relative` box that bounds the tile's image (a plain
 * sibling of the image div, or passed as extra children into
 * `ImageLightbox`, which already wraps its children in one).
 *
 * The code-demo badge is the *only* signal a tile gives that a piece runs —
 * tiles deliberately don't boot iframes (thirty tiles would be thirty rAF
 * loops, and asynchronously-booting content would make the masonry heights
 * unstable). The badge says there's more here, and the click target already
 * goes to the page where the thing runs.
 */
export function MediaBadges({ item }: { item: WorkItem }) {
  const speedpaint = hasSpeedpaint(item)
  const animation = hasAnimation(item)
  const codeDemo = isCodeDemo(item)
  if (!speedpaint && !animation && !codeDemo) return null

  const facts = [
    speedpaint && 'a speedpaint video',
    animation && 'an animation',
    codeDemo && 'a code demo you can run',
  ].filter(Boolean) as string[]

  return (
    <>
      {/*
        The icons are decorative, but "there's more here than a still image"
        isn't — so the fact itself is announced once, in text, while the
        glyphs stay aria-hidden.
      */}
      <span className="sr-only">
        {`Includes ${facts.length > 1 ? `${facts.slice(0, -1).join(', ')} and ${facts[facts.length - 1]}` : facts[0]}.`}
      </span>
      {/* The corner pills share one row so a piece carrying both sits as a
          neat pair rather than stacking two absolutes on the same spot. A
          single pill lands exactly where the speedpaint one always has. */}
      {(speedpaint || codeDemo) && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 z-20 flex items-center gap-1.5">
          {codeDemo && (
            <span
              aria-hidden="true"
              title="Includes a code demo you can run"
              className="inline-flex items-center justify-center rounded-full bg-background/85 p-1.5 text-foreground/70 backdrop-blur-sm"
            >
              <Binary className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
          )}
          {speedpaint && (
            <span
              aria-hidden="true"
              title="Includes a speedpaint video"
              className="inline-flex items-center justify-center rounded-full bg-background/85 p-1.5 text-foreground/70 backdrop-blur-sm"
            >
              <CircleDot className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
          )}
        </span>
      )}
      {animation && (
        <span
          aria-hidden="true"
          title="Includes an animation"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        >
          <Play
            className="h-9 w-9 scale-100 text-white opacity-80 drop-shadow-[0_1px_5px_rgba(0,0,0,0.65)] transition-all duration-300 ease-out group-hover:scale-110 group-hover:opacity-100 group-hover:[animation:media-badge-pulse_1.6s_ease-in-out_infinite]"
            strokeWidth={1.5}
            fill="currentColor"
          />
        </span>
      )}
    </>
  )
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Shared frame/border/rounding so the animation and speedpaint players never drift apart visually. */
function PlayerFrame({
  aspect,
  className,
  children,
}: {
  aspect?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl border border-border bg-black', className)}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      {children}
    </div>
  )
}

/**
 * A finished animation clip — native `<video controls>`, the way you'd
 * expect to watch anything else. Distinct from SpeedpaintPlayer below on
 * purpose: this is meant to be pressed play on and watched, not scrubbed.
 */
export function AnimationPlayer({
  src,
  poster,
  aspect,
  title,
  className,
}: {
  src: string
  poster?: string
  aspect?: string
  title: string
  className?: string
}) {
  return (
    <PlayerFrame aspect={aspect} className={className}>
      {/*
        Muted by default: this clip carries the original reel's music bed,
        and a portfolio page shouldn't start making noise because someone
        pressed play. Controls keep unmuting one click away.
      */}
      <video controls muted playsInline preload="metadata" poster={poster} className="h-full w-full" aria-label={title}>
        <source src={src} type="video/mp4" />
      </video>
    </PlayerFrame>
  )
}

/**
 * A speedpaint/process video with a scrubber that's always on screen,
 * instead of native controls that hide themselves during playback. The
 * point of a speedpaint is watching (or dragging through) every stroke, so
 * the transport has to stay visible rather than fading the moment it plays.
 *
 * Deliberately still a real, unrestricted `<video>` element (no
 * `controlsList`, no full-bleed overlay swallowing right-click) — the
 * browser's native context menu (play/pause, loop, picture-in-picture, save)
 * keeps working on top of these custom controls. That's how looping is
 * offered: no `loop` attribute by default, right-click → Loop for anyone who
 * wants it.
 */
export function SpeedpaintPlayer({
  item,
  src,
  poster,
  aspect,
  className,
}: {
  item: WorkItem
  src: string
  poster?: string
  aspect?: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const wasPlayingRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const tone = toneFor(item)
  const timeId = `speedpaint-time-${item.slug}`

  // Polls currentTime via rAF instead of the `timeupdate` event, which fires
  // in ~4 coarse steps a second in most browsers — too choppy to drive a bar
  // that's supposed to read as continuous.
  useEffect(() => {
    if (!playing || scrubbing) return
    const tick = () => {
      if (videoRef.current) setTime(videoRef.current.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, scrubbing])

  // The browser can finish loading metadata before React hydrates and
  // attaches `onLoadedMetadata` — a real race on a fast local/cached load,
  // not a hypothetical. That native event never replays for a listener
  // attached after it fired, so `duration` would stay stuck at 0 forever.
  // Reading the ref directly once mounted catches that case; the handler
  // below still covers the normal case where metadata arrives later.
  useEffect(() => {
    const v = videoRef.current
    if (v && Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }, [])

  const seekTo = useCallback((next: number) => {
    setTime(next)
    if (videoRef.current) videoRef.current.currentTime = next
  }, [])

  const startScrub = useCallback(() => {
    wasPlayingRef.current = !!videoRef.current && !videoRef.current.paused
    videoRef.current?.pause()
    setScrubbing(true)
  }, [])

  const endScrub = useCallback(() => {
    setScrubbing(false)
    if (wasPlayingRef.current) videoRef.current?.play()
  }, [])

  const last = Math.max(duration, 0)

  return (
    <div className={className}>
      <PlayerFrame aspect={aspect}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          // object-contain rather than the CSS default (which stretches
          // playing frames to fill but tends to letterbox the poster,
          // depending on browser) — makes the two consistent. A guard
          // against a poster/video aspect mismatch in general, not any one
          // piece's shape today.
          className="h-full w-full cursor-pointer object-contain"
          aria-label={`${item.title} — speedpaint video`}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration
            if (Number.isFinite(d) && d > 0) setDuration(d)
          }}
          onDurationChange={(e) => {
            const d = e.currentTarget.duration
            if (Number.isFinite(d) && d > 0) setDuration(d)
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
        />
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          aria-pressed={playing}
          className="absolute bottom-3 left-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur-sm transition-colors hover:bg-card"
        >
          {playing ? (
            <Pause className="h-4 w-4" strokeWidth={1.75} fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" strokeWidth={1.75} fill="currentColor" />
          )}
        </button>
      </PlayerFrame>

      {/* Always visible — never fades on play, never hides behind hover,
          unlike native video chrome. This persistence is the whole point. */}
      <div className="mt-4 flex items-center gap-3">
        <CircleDot
          className="h-4 w-4 shrink-0"
          style={{ color: `color-mix(in srgb, ${tone} 70%, transparent)` }}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={Math.min(time, last)}
          onChange={(e) => seekTo(Number(e.target.value))}
          onPointerDown={startScrub}
          onPointerUp={endScrub}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') startScrub()
          }}
          onKeyUp={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') endScrub()
          }}
          className="speedpaint-timeline w-full"
          style={{ '--speedpaint-tone': tone, '--speedpaint-progress': `${last ? (time / last) * 100 : 0}%` } as CSSProperties}
          aria-label={`${item.title} — scrub the speedpaint video`}
          aria-valuetext={`${formatTime(time)} of ${formatTime(last)}`}
          aria-describedby={timeId}
        />
        <span
          id={timeId}
          className="font-brand w-[5.5rem] shrink-0 text-right text-xs tabular-nums text-muted-foreground"
        >
          {formatTime(time)} / {formatTime(last)}
        </span>
      </div>
    </div>
  )
}

/**
 * The media block for a piece's own page: renders whichever of
 * {animation, speedpaint, plain image} the piece actually has — additively,
 * not as an either/or, so a piece carrying both gets both, each labeled.
 * Always ends with a small "view still" trigger into the ordinary
 * ImageLightbox, since neither video type is a substitute for seeing the
 * finished image full-screen (a `bare` lightbox, so it doesn't try to
 * overlay a video with its own hover scrim).
 */
export function PieceMedia({
  piece,
  lightboxItems,
  lightboxIndex = 0,
  className,
}: {
  piece: WorkPiece
  lightboxItems: WorkPiece[]
  lightboxIndex?: number
  className?: string
}) {
  const { animationSrc, speedpaintSrc } = piece
  if (!piece.image && !animationSrc && !speedpaintSrc) return null

  if (!animationSrc && !speedpaintSrc) {
    return (
      <ImageLightbox items={lightboxItems} initialIndex={lightboxIndex} className={className}>
        <div className="aspect-[16/10] w-full overflow-hidden" style={aspectStyleFor(piece)}>
          <WorkPlaceholder item={piece} />
        </div>
      </ImageLightbox>
    )
  }

  const both = Boolean(animationSrc && speedpaintSrc)

  return (
    <div className={className}>
      {animationSrc && (
        <div>
          {both && (
            <p className="font-brand mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">finished animation</p>
          )}
          <AnimationPlayer
            src={animationSrc}
            poster={piece.image}
            aspect={piece.imageAspect}
            title={piece.title}
          />
        </div>
      )}
      {speedpaintSrc && (
        <div className={both ? 'mt-8' : undefined}>
          {both && (
            <p className="font-brand mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">speedpaint</p>
          )}
          <SpeedpaintPlayer
            item={piece}
            src={speedpaintSrc}
            poster={piece.image}
            aspect={speedpaintAspect(piece)}
          />
        </div>
      )}
      <ImageLightbox items={lightboxItems} initialIndex={lightboxIndex} bare className="mt-4">
        <span className="font-brand inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs lowercase text-muted-foreground transition-colors group-hover:text-foreground">
          <Expand className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          view still image
        </span>
      </ImageLightbox>
    </div>
  )
}
