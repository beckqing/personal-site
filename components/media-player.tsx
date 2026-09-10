'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CircleDot, Expand, Pause, Play } from 'lucide-react'
import {
  animationPosterFor,
  hasAnimation,
  hasSpeedpaint,
  isCodeDemo,
  speedpaintAspect,
  toneFor,
  type EmbeddedVideo,
  type WorkItem,
  type WorkPiece,
} from '@/lib/work'
import { aspectStyleFor, WorkPlaceholder } from '@/components/work-visuals'
import { ImageLightbox } from '@/components/image-lightbox'
import { cn } from '@/lib/utils'

/**
 * Quiet indicators for a gallery tile carrying extra media — a speedpaint or
 * a finished animation, plus the accessible announcement for a runnable code
 * demo. Purely decorative: the badges themselves do nothing. On a
 * collection-page tile the surrounding element is still a plain link and
 * does the navigating; on a top-level gallery `ImageCard`, the image itself
 * is now the button that opens the lightbox in place (see
 * `opensInGalleryLightbox` in lib/work.ts) — a code demo is the one
 * exception, since its `image` is only a poster still and stays a plain
 * navigating link. Meant to sit inside the same `relative` box that bounds
 * the tile's image (a plain sibling of the image div, or passed as extra
 * children into `ImageLightbox`, which already wraps its children in one).
 *
 * A code demo no longer gets a corner icon here — its `ImageCard`
 * (work-gallery.tsx) carries the same state rail + control rail as
 * `CodeDemoFrame` and `PieceColumn`, which says "this is a program" far
 * louder than a small glyph did. The sr-only fact stays, since that rail is
 * `aria-hidden` decoration and something still has to announce the demo to
 * assistive tech.
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
        The icon is decorative, but "there's more here than a still image"
        isn't — so the fact itself is announced once, in text, while the
        glyph stays aria-hidden.
      */}
      <span className="sr-only">
        {`Includes ${facts.length > 1 ? `${facts.slice(0, -1).join(', ')} and ${facts[facts.length - 1]}` : facts[0]}.`}
      </span>
      {speedpaint && (
        <span
          className={cn(
            'pointer-events-none absolute right-2.5 z-20',
            // A code demo's state rail pushes the poster (and this corner
            // pill) down by its own height — see ImageCard.
            codeDemo ? 'top-[calc(0.75rem+2rem)]' : 'top-2.5',
          )}
        >
          <span
            aria-hidden="true"
            title="Includes a speedpaint video"
            className="inline-flex items-center justify-center rounded-full bg-background/85 p-1.5 text-foreground/70 backdrop-blur-sm"
          >
            <CircleDot className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
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
  bare = false,
  className,
  children,
}: {
  aspect?: string
  /** Omits the border — for AnimationEmbed, whose YouTube iframe already has its own visible edge and doesn't need a second one drawn around it. */
  bare?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl bg-black', !bare && 'border border-border', className)}
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
 * A finished animation that lives on YouTube — the embedded sibling of
 * `AnimationPlayer`, for a clip too long or heavy to self-host (see TODO
 * §14b's budget math). Built as a facade, the same principle `CodeDemoFrame`
 * already uses for the same two reasons: reserve the box up front so
 * pressing play never shifts the page, and don't pull YouTube's ~1MB of
 * player script onto every visit — only once someone actually asks.
 *
 * No message contract or fullscreen plumbing here, unlike `CodeDemoFrame` —
 * YouTube's own player already provides both, and re-implementing either
 * would just be fighting the iframe for control it already has.
 */
export function AnimationEmbed({
  video,
  poster,
  title,
  className,
}: {
  video: EmbeddedVideo
  poster?: string
  title: string
  className?: string
}) {
  const [playing, setPlaying] = useState(false)

  return (
    <PlayerFrame aspect={video.aspect} bare className={className}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
          title={title}
          className="h-full w-full border-0"
          // No sandbox attribute: unlike CodeDemoFrame's exploratory local
          // code, this is YouTube's own player, which needs same-origin
          // access to itself to work at all — sandboxing it would just
          // break playback, not add a real boundary.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative block h-full w-full cursor-pointer"
          aria-label={`Play ${title}`}
        >
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element -- a plain
            // <img> here, not next/image: the poster is the button's own
            // background, sized by the reserved aspect box already, and
            // Image's fill mode would need this to be a non-interactive div
            // instead of the button it actually is.
            <img src={poster} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-black" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
              <Play className="h-5 w-5 translate-x-[1px]" strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
            </span>
          </span>
        </button>
      )}
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
  const { animationSrc, animationEmbed, speedpaintSrc } = piece
  const hasAnim = Boolean(animationSrc || animationEmbed)
  if (!piece.image && !hasAnim && !speedpaintSrc) return null

  if (!hasAnim && !speedpaintSrc) {
    return (
      <ImageLightbox items={lightboxItems} initialIndex={lightboxIndex} className={className}>
        <div className="aspect-[16/10] w-full overflow-hidden" style={aspectStyleFor(piece)}>
          <WorkPlaceholder item={piece} />
        </div>
      </ImageLightbox>
    )
  }

  const both = Boolean(hasAnim && speedpaintSrc)

  return (
    <div className={className}>
      {hasAnim && (
        <div>
          {both && (
            <p className="font-brand mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">finished animation</p>
          )}
          {animationSrc ? (
            <AnimationPlayer
              src={animationSrc}
              poster={animationPosterFor(piece)}
              aspect={piece.imageAspect}
              title={piece.title}
            />
          ) : (
            animationEmbed && (
              <AnimationEmbed video={animationEmbed} poster={animationPosterFor(piece)} title={piece.title} />
            )
          )}
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
