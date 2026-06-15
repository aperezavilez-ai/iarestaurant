import { useId } from 'react'
import { cn } from '@/lib/utils'

interface LogoMarkProps {
  className?: string
}

/** Icono de marca IA·RESTAURANT — target + nodo IA sobre gradiente ámbar */
export function LogoMark({ className }: LogoMarkProps) {
  const gid = useId().replace(/:/g, '')

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('block', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`lg-${gid}`} x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id={`hl-${gid}`} x1="12" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill={`url(#lg-${gid})`} />
      <rect width="24" height="24" rx="6" fill={`url(#hl-${gid})`} />
      <circle cx="12" cy="12" r="7.25" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.92" />
      <circle cx="12" cy="12" r="2.75" fill="#FFFFFF" />
      <circle cx="17.75" cy="6.25" r="2" fill="#FEF3C7" />
      <path
        d="M14.35 9.65 L16.2 7.8"
        stroke="#FEF3C7"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  )
}
