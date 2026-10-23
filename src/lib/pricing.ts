import { calculateAdvance, calculateTax } from "./money";

export interface PriceablePackage {
  id: string;
  name: string;
  priceInPaise: number;
}

export interface PriceableService {
  id: string;
  name: string;
  category: string;
  priceInPaise: number;
}

export interface PriceRequest {
  packageId: string;
  serviceItems: { serviceId: string; quantity: number }[];
  waterSupply: boolean;
}

export interface CalculatedLineItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPriceInPaise: number;
  totalInPaise: number;
}

export function calculateBookingPrice(
  request: PriceRequest,
  packageRecord: PriceablePackage | undefined,
  availableServices: PriceableService[],
  settings: { advancePercent: number; taxBasisPoints: number },
) {
  if (!packageRecord || packageRecord.id !== request.packageId) {
    throw new Error("The selected package is unavailable");
  }

  const requested = new Map<string, number>();
  for (const item of request.serviceItems) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new Error("Invalid service quantity");
    }
    requested.set(item.serviceId, (requested.get(item.serviceId) ?? 0) + item.quantity);
  }

  if (request.waterSupply) {
    const waterService = availableServices.find((service) => service.category.toLowerCase().includes("water"));
    if (waterService && !requested.has(waterService.id)) requested.set(waterService.id, 1);
  }

  const items: CalculatedLineItem[] = [];
  for (const [serviceId, quantity] of requested) {
    const service = availableServices.find((candidate) => candidate.id === serviceId);
    if (!service) throw new Error("A selected additional service is unavailable");
    items.push({
      serviceId: service.id,
      serviceName: service.name,
      quantity,
      unitPriceInPaise: service.priceInPaise,
      totalInPaise: service.priceInPaise * quantity,
    });
  }

  if (!request.waterSupply) {
    const waterIds = availableServices.filter((service) => service.category.toLowerCase().includes("water")).map((service) => service.id);
    if (items.some((item) => waterIds.includes(item.serviceId))) {
      throw new Error("Enable water supply to include the water-supply service");
    }
  }

  const subtotalInPaise = packageRecord.priceInPaise + items.reduce((sum, item) => sum + item.totalInPaise, 0);
  const discountInPaise = 0;
  const taxInPaise = calculateTax(subtotalInPaise - discountInPaise, settings.taxBasisPoints);
  const totalInPaise = subtotalInPaise - discountInPaise + taxInPaise;
  const advanceInPaise = calculateAdvance(totalInPaise, settings.advancePercent);

  const amounts = [subtotalInPaise, taxInPaise, totalInPaise, advanceInPaise, ...items.map((item) => item.totalInPaise)];
  if (!amounts.every((amount) => Number.isSafeInteger(amount) && amount <= 2_000_000_000)) {
    throw new Error("Calculated amount exceeds supported limits");
  }

  return {
    packageName: packageRecord.name,
    packagePriceInPaise: packageRecord.priceInPaise,
    items,
    subtotalInPaise,
    discountInPaise,
    taxInPaise,
    totalInPaise,
    advanceInPaise,
    balanceInPaise: totalInPaise - advanceInPaise,
  };
}
