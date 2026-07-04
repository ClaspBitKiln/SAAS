import { describe, it, expect } from 'vitest';
import { mapDaDataParty } from '../../infrastructure/inn-lookup.service';

describe('mapDaDataParty', () => {
  it('maps a found party', () => {
    const result = mapDaDataParty({
      suggestions: [
        {
          data: {
            inn: '7707083893',
            kpp: '773601001',
            ogrn: '1027700132195',
            name: { short_with_opf: 'ПАО СБЕРБАНК', full_with_opf: 'ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО «СБЕРБАНК РОССИИ»' },
            state: { status: 'ACTIVE' },
            address: { unrestricted_value: 'г Москва, ул Вавилова, д 19' },
            management: { name: 'Иванов Иван', post: 'ПРЕЗИДЕНТ' },
          },
        },
      ],
    });
    expect(result.configured).toBe(true);
    expect(result.found).toBe(true);
    expect(result.name).toBe('ПАО СБЕРБАНК');
    expect(result.ogrn).toBe('1027700132195');
    expect(result.status).toBe('ACTIVE');
    expect(result.address).toContain('Вавилова');
  });

  it('returns found=false on empty suggestions', () => {
    expect(mapDaDataParty({ suggestions: [] })).toEqual({ configured: true, found: false });
    expect(mapDaDataParty({})).toEqual({ configured: true, found: false });
  });
});
