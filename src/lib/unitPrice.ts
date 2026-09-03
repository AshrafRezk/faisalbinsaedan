export type PricedUnit = {
  price?: number | string
  finalPrice?: number | string
  eligibleForSubsidies?: boolean
  subsidies?: string | number
}

function toMoney(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function originalPrice(unit: PricedUnit): number {
  return toMoney(unit.price) ?? 0
}

function subsidyAmount(subsidies?: string | number): number | undefined {
  if (subsidies == null || subsidies === '') return undefined
  if (typeof subsidies === 'number') {
    return Number.isFinite(subsidies) ? subsidies : undefined
  }
  if (/^(yes|no|true|false)$/i.test(subsidies.trim())) return undefined
  const n = Number(subsidies)
  return Number.isFinite(n) ? n : undefined
}

/** Original list price (before subsidy). */
export function getUnitOriginalPrice(unit: PricedUnit): number {
  return originalPrice(unit)
}

/** List/original price when not subsidy-eligible; subsidized (final) price when eligible. */
export function getUnitDisplayPrice(unit: PricedUnit): number {
  const original = originalPrice(unit)
  if (!unit.eligibleForSubsidies) return original

  const subsidized = toMoney(unit.finalPrice)
  if (subsidized != null) return subsidized

  const amount = subsidyAmount(unit.subsidies)
  if (amount != null && amount > 0) {
    return Math.max(0, original - amount)
  }

  return original
}

export type UnitPriceBreakdown = {
  original: number
  afterSubsidy: number
  showBoth: boolean
}

/** Original + after-subsidy prices. Both are shown only when the unit is subsidy-eligible. */
export function getUnitPriceBreakdown(unit: PricedUnit): UnitPriceBreakdown {
  const original = getUnitOriginalPrice(unit)
  const afterSubsidy = getUnitDisplayPrice(unit)
  return {
    original,
    afterSubsidy,
    showBoth: !!unit.eligibleForSubsidies,
  }
}
