export type CompanyIntakeFields = {
  name: string;
  inn: string;
  email: string;
  phone: string;
  website: string;
};

export function extractCompanyInformation(text: string, country = 'RU') {
  const fields: Partial<CompanyIntakeFields> = {};
  const ambiguous: Array<keyof CompanyIntakeFields> = [];
  const select = (field: keyof CompanyIntakeFields, values: string[]) => {
    const unique = [...new Set(values)];
    if (unique.length === 1) fields[field] = unique[0];
    if (unique.length > 1) ambiguous.push(field);
  };
  const source = text.slice(0, 4000);
  const contactSource = source.replace(/(?:https?:\/\/|www\.)[^\s<>"«»]+/giu, '');
  select('name', [...source.matchAll(/^(?:компания|организация)\s*:\s*(.{2,255})$/gimu)]
    .map((match) => match[1].trim()));
  select('email', [...contactSource.matchAll(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/giu)]
    .map((match) => match[0].toLowerCase()));
  select('website', [...source.matchAll(/(?:https?:\/\/|www\.)[^\s<>"«»]+/giu)]
    .map((match) => match[0].replace(/[.,;:!?)]+$/, ''))
    .flatMap((value) => {
      try {
        const url = new URL(value.startsWith('www.') ? `https://${value}` : value);
        return url.username || url.password || !url.hostname.includes('.') ? [] : [url.href];
      } catch { return []; }
    }));
  select('phone', [...contactSource.matchAll(/(?:\+|(?:тел(?:ефон)?\.?|phone)\s*:\s*)\d[\d ()-]{8,30}\d/giu)]
    .map((match) => {
      const raw = match[0].replace(/^(?:тел(?:ефон)?\.?|phone)\s*:\s*/iu, '');
      return `${raw.startsWith('+') ? '+' : ''}${raw.replace(/\D/g, '')}`;
    })
    .filter((value) => /^\+?\d{10,15}$/.test(value)));
  if (country === 'RU') {
    select('inn', [...source.matchAll(/(?:^|\s)ИНН\s*:?\s*(\d{12}|\d{10})(?!\d)/giu)]
      .map((match) => match[1]));
  }
  return { fields, ambiguous };
}

export function fillEmptyCompanyFields<T extends CompanyIntakeFields>(
  current: T, fields: Partial<CompanyIntakeFields>,
): T {
  const next = { ...current };
  for (const key of Object.keys(fields) as Array<keyof CompanyIntakeFields>) {
    if (!current[key].trim() && fields[key]) next[key] = fields[key] as T[typeof key];
  }
  return next;
}
