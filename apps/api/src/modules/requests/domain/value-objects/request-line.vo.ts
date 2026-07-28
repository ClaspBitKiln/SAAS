export interface RequestLineProps {
  gost?: string | null;
  steelGrade?: string | null;
  productType?: string | null;
  dimensions?: string | null;
  length?: string | null;
  thickness?: string | null;
  coating?: string | null;
  quantity?: string | null;
  unit?: string | null;
  rawLine?: string | null;
  purchaseAmount?: number | null;
  saleAmount?: number | null;
}

function money(value: number | null | undefined, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Request quote: ${field} must be a non-negative number`);
  }
  return Math.round(value * 100) / 100;
}

export class RequestLine {
  readonly id: string;
  readonly sortOrder: number;
  readonly gost: string | null;
  readonly steelGrade: string | null;
  readonly productType: string | null;
  readonly dimensions: string | null;
  readonly length: string | null;
  readonly thickness: string | null;
  readonly coating: string | null;
  readonly quantity: string | null;
  readonly unit: string | null;
  readonly rawLine: string | null;
  readonly purchaseAmount: number | null;
  readonly saleAmount: number | null;

  private constructor(id: string, sortOrder: number, props: RequestLineProps) {
    this.id = id;
    this.sortOrder = sortOrder;
    this.gost = props.gost?.trim() || null;
    this.steelGrade = props.steelGrade?.trim() || null;
    this.productType = props.productType?.trim() || null;
    this.dimensions = props.dimensions?.trim() || null;
    this.length = props.length?.trim() || null;
    this.thickness = props.thickness?.trim() || null;
    this.coating = props.coating?.trim() || null;
    this.quantity = props.quantity?.trim() || null;
    this.unit = props.unit?.trim() || null;
    this.rawLine = props.rawLine?.trim() || null;
    this.purchaseAmount = money(props.purchaseAmount, 'purchase amount');
    this.saleAmount = money(props.saleAmount, 'sale amount');
  }

  static create(id: string, sortOrder: number, props: RequestLineProps): RequestLine {
    if (!props.rawLine && !props.steelGrade && !props.gost) {
      throw new Error('RequestLine: at least rawLine or steelGrade/gost required');
    }
    return new RequestLine(id, sortOrder, props);
  }

  static rehydrate(id: string, sortOrder: number, props: RequestLineProps): RequestLine {
    return new RequestLine(id, sortOrder, props);
  }

  withCommercials(purchaseAmount: number, saleAmount: number): RequestLine {
    return new RequestLine(this.id, this.sortOrder, {
      gost: this.gost,
      steelGrade: this.steelGrade,
      productType: this.productType,
      dimensions: this.dimensions,
      length: this.length,
      thickness: this.thickness,
      coating: this.coating,
      quantity: this.quantity,
      unit: this.unit,
      rawLine: this.rawLine,
      purchaseAmount,
      saleAmount,
    });
  }
}
