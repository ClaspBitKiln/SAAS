/** Supported countries (CIS focus). */
export enum CompanyCountryEnum {
  RU = 'RU',
  UZ = 'UZ',
  KZ = 'KZ',
  KG = 'KG',
}

/** Tax id format per country: RU ИНН 10/12 · UZ СТИР 9 · KZ БИН/ИИН 12 · KG ИНН 14. */
const TAX_ID_PATTERNS: Record<CompanyCountryEnum, RegExp> = {
  [CompanyCountryEnum.RU]: /^\d{10}$|^\d{12}$/,
  [CompanyCountryEnum.UZ]: /^\d{9}$/,
  [CompanyCountryEnum.KZ]: /^\d{12}$/,
  [CompanyCountryEnum.KG]: /^\d{14}$/,
};

export class Inn {
  constructor(private readonly _value: string, country: CompanyCountryEnum = CompanyCountryEnum.RU) {
    const digits = _value.replace(/\s/g, '');
    const pattern = TAX_ID_PATTERNS[country] ?? TAX_ID_PATTERNS[CompanyCountryEnum.RU];
    if (!pattern.test(digits)) {
      throw new Error(`Inn: invalid tax id format for ${country}`);
    }
    this._value = digits;
  }

  toString(): string {
    return this._value;
  }
}
