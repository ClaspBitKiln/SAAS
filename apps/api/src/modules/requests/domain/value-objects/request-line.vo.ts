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
}
