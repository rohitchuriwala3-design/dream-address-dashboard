export class PricingError extends Error {}
export class PriceListNotFound extends PricingError {
  constructor(public readonly id: string) { super(`Price list not found: ${id}`); }
}
export class ProductNotFound extends PricingError {
  constructor(public readonly id: string) { super(`Product not found: ${id}`); }
}
export class PriceListDepthExceeded extends PricingError {
  constructor(public readonly id: string) { super(`Price list chain too deep at ${id}`); }
}
