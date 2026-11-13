import { useEffect, useRef, useState, type ReactNode } from 'react'
import { compactMoney, niceTicks } from '../../utils/chartScale'

export interface FlowPoint {
  key: string
  /** Axis label; empty string hides it. */
  label: string
  /** Accessible name of the column. */
  name: string
  income: number
  expense: number
  balance: number
}

interface FlowChartProps {
  points: FlowPoint[]
  label: string
  balanceLabel: string
  /** Title of the lower band (income up, expenses down). */
  flowLabel?: string
  selected?: string | null
  marker?: { key: string; label: string }
  onSelect?: (key: string) => void
  tooltip: (point: FlowPoint) => ReactNode
}

const HEIGHT = 268
// The left gutter holds the band names (vertical, next to the numbers) and then the axis numbers.
const PAD = { left: 84, right: 12 }
const BAND_LABEL_X = 12
const LINE = { top: 26, bottom: 86 }
const BARS = { top: 128, bottom: 240 }

/** Width of the element, so the SVG draws at 1:1 and its 12px text never shrinks. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

const scale = (ticks: number[], top: number, bottom: number) => {
  const min = ticks[0]
  const max = ticks[ticks.length - 1]
  return (value: number) => (max === min ? bottom : bottom - ((value - min) / (max - min)) * (bottom - top))
}

/**
 * Two bands sharing the x axis: the balance line on top and income (up) / expenses (down) below.
 * Separate bands instead of a second y axis, because a balance is usually far larger than a day's flow.
 */
export function FlowChart({ points, label, balanceLabel, flowLabel = 'Fluxo do dia', selected, marker, onSelect, tooltip }: FlowChartProps) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const plotWidth = width - PAD.left - PAD.right
  const slot = plotWidth / points.length
  const x = (index: number) => PAD.left + slot * (index + 0.5)
  const barWidth = Math.max(3, Math.min(slot * 0.62, 26))

  // The balance band follows the balance: no forced zero, so it never repeats the zero of the band below.
  const balanceTicks = niceTicks(Math.min(...points.map((point) => point.balance)), Math.max(...points.map((point) => point.balance)), 2, false)
  const flowTicks = niceTicks(-Math.max(0, ...points.map((point) => point.expense)), Math.max(0, ...points.map((point) => point.income)), 4)
  const yBalance = scale(balanceTicks, LINE.top, LINE.bottom)
  const yFlow = scale(flowTicks, BARS.top, BARS.bottom)
  const zero = yFlow(0)
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${yBalance(point.balance).toFixed(1)}`).join(' ')
  const markerIndex = marker ? points.findIndex((point) => point.key === marker.key) : -1
  const focus = hover ?? null
  const dim = (index: number) => (selected && points[index].key !== selected ? 0.4 : 1)

  return (
    <div className="flow-chart" ref={ref} onMouseLeave={() => setHover(null)}>
      <svg className="chart" viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} role="img" aria-label={label}>
        <text className="flow-band-label" x={BAND_LABEL_X} y={(LINE.top + LINE.bottom) / 2} transform={`rotate(-90 ${BAND_LABEL_X} ${(LINE.top + LINE.bottom) / 2})`} textAnchor="middle" dominantBaseline="middle">{balanceLabel}</text>
        {balanceTicks.map((tick) => (
          <g key={`b${tick}`}>
            <line className={tick === 0 ? 'axis-zero' : 'grid'} x1={PAD.left} x2={width - PAD.right} y1={yBalance(tick)} y2={yBalance(tick)} />
            <text x={PAD.left - 8} y={yBalance(tick) + 4} textAnchor="end">{compactMoney(tick)}</text>
          </g>
        ))}
        <text className="flow-band-label" x={BAND_LABEL_X} y={(BARS.top + BARS.bottom) / 2} transform={`rotate(-90 ${BAND_LABEL_X} ${(BARS.top + BARS.bottom) / 2})`} textAnchor="middle" dominantBaseline="middle">{flowLabel}</text>
        {flowTicks.map((tick) => (
          <g key={`f${tick}`}>
            <line className={tick === 0 ? 'axis-zero' : 'grid'} x1={PAD.left} x2={width - PAD.right} y1={yFlow(tick)} y2={yFlow(tick)} />
            <text x={PAD.left - 8} y={yFlow(tick) + 4} textAnchor="end">{compactMoney(tick)}</text>
          </g>
        ))}
        {focus !== null && <rect className="flow-focus" x={x(focus) - slot / 2} y={LINE.top - 6} width={slot} height={BARS.bottom - LINE.top + 6} rx={4} />}
        {markerIndex >= 0 && (
          <g className="flow-marker">
            <line x1={x(markerIndex)} x2={x(markerIndex)} y1={LINE.top - 4} y2={BARS.bottom} />
            <text x={x(markerIndex) + 5} y={(LINE.bottom + BARS.top) / 2 + 4}>{marker!.label}</text>
          </g>
        )}
        {points.map((point, index) => (
          <g key={point.key}>
            <g opacity={dim(index)}>
              {point.income > 0 && <rect className="flow-income" x={x(index) - barWidth / 2} y={yFlow(point.income)} width={barWidth} height={Math.max(2, zero - yFlow(point.income))} rx={Math.min(3, barWidth / 3)} />}
              {point.expense > 0 && <rect className="flow-expense" x={x(index) - barWidth / 2} y={zero + 1} width={barWidth} height={Math.max(2, yFlow(-point.expense) - zero)} rx={Math.min(3, barWidth / 3)} />}
            </g>
            {point.label && <text x={x(index)} y={HEIGHT - 6} textAnchor="middle" className={selected === point.key ? 'is-current' : undefined}>{point.label}</text>}
          </g>
        ))}
        <path className="flow-balance" d={path} />
        {focus !== null && <circle className="flow-dot" cx={x(focus)} cy={yBalance(points[focus].balance)} r={4.5} />}
      </svg>
      <div className="flow-hits">
        {points.map((point, index) => (
          <button
            key={point.key}
            type="button"
            style={{ left: `${((x(index) - slot / 2) / width) * 100}%`, width: `${(slot / width) * 100}%` }}
            aria-label={point.name}
            aria-pressed={onSelect ? selected === point.key : undefined}
            onMouseEnter={() => setHover(index)}
            onFocus={() => setHover(index)}
            onBlur={() => setHover(null)}
            onClick={() => onSelect?.(point.key)}
          />
        ))}
      </div>
      {focus !== null && (
        <div
          className="chart-tooltip"
          role="status"
          style={width < 560 ? { left: 8, right: 8, top: 8, maxWidth: 'none' } : x(focus) < width / 2 ?{ left: x(focus) + slot / 2 + 8, top: 8 } : { right: width - x(focus) + slot / 2 + 8, top: 8 }}
        >
          {tooltip(points[focus])}
        </div>
      )}
    </div>
  )
}
