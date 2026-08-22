import {
  Palette,
  Feather,
  FlaskConical,
  Code2,
  Sparkles,
  BookOpen,
  Microscope,
  PenTool,
  Music,
  Leaf,
  Beaker,
  Moon,
  Dna,
  Camera,
  Globe,
  Ruler,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Doodle = {
  Icon: LucideIcon
  top: string
  left: string
  size: number
  rotate: number
}

// Hand-scattered layout echoing Beck's doodle-icon brand pattern.
const DOODLES: Doodle[] = [
  { Icon: Code2, top: '8%', left: '6%', size: 34, rotate: -12 },
  { Icon: FlaskConical, top: '15%', left: '85%', size: 30, rotate: 10 },
  { Icon: Palette, top: '4%', left: '46%', size: 26, rotate: 6 },
  { Icon: Feather, top: '30%', left: '92%', size: 32, rotate: -18 },
  { Icon: Moon, top: '46%', left: '3%', size: 28, rotate: 8 },
  { Icon: Sparkles, top: '62%', left: '88%', size: 24, rotate: 0 },
  { Icon: BookOpen, top: '78%', left: '10%', size: 30, rotate: 12 },
  { Icon: Microscope, top: '86%', left: '70%', size: 32, rotate: -8 },
  { Icon: PenTool, top: '70%', left: '40%', size: 26, rotate: 18 },
  { Icon: Music, top: '22%', left: '24%', size: 24, rotate: -6 },
  { Icon: Leaf, top: '54%', left: '58%', size: 28, rotate: 14 },
  { Icon: Beaker, top: '38%', left: '72%', size: 26, rotate: -14 },
  { Icon: Dna, top: '90%', left: '30%', size: 30, rotate: 6 },
  { Icon: Camera, top: '10%', left: '66%', size: 26, rotate: 16 },
  { Icon: Globe, top: '58%', left: '20%', size: 28, rotate: -10 },
  { Icon: Ruler, top: '33%', left: '48%', size: 24, rotate: 20 },
]

export function DoodleField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {DOODLES.map(({ Icon, top, left, size, rotate }, i) => (
        <Icon
          key={i}
          className="absolute text-secondary/20"
          style={{
            top,
            left,
            width: size,
            height: size,
            transform: `rotate(${rotate}deg)`,
          }}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}
