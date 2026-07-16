export interface StatTile {
  label: string
  value: string | number
  sub?: string
}

interface StatTilesProps {
  tiles: StatTile[]
}

/** Row of headline stat cards. Big number in font-display, muted label. */
export function StatTiles({ tiles }: StatTilesProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="card min-w-[150px] flex-1 basis-[150px]">
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">{tile.label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
            {typeof tile.value === 'number' ? tile.value.toLocaleString() : tile.value}
          </p>
          {tile.sub && <p className="mt-1 text-xs text-charcoal-400">{tile.sub}</p>}
        </div>
      ))}
    </div>
  )
}

export default StatTiles
