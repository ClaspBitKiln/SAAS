"""Source-backed company enrichment preview; no CRM writes or third-party dependencies."""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request

SOURCE = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party'


def validate_inn(inn):
    if not isinstance(inn, str) or not re.fullmatch(r'\d{10}|\d{12}', inn, flags=re.ASCII):
        raise ValueError('INN must contain 10 or 12 ASCII digits')
    digits = list(map(int, inn))
    def checksum(weights):
        return sum(d * w for d, w in zip(digits, weights)) % 11 % 10
    if len(inn) == 10:
        valid = checksum([2, 4, 10, 3, 5, 9, 4, 6, 8]) == digits[9]
    else:
        valid = (checksum([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) == digits[10]
                 and checksum([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) == digits[11])
    if not valid or len(set(inn)) == 1:
        raise ValueError('INN checksum is invalid')
    return inn


def build_preview(inn, response, account, *, observed_at, origin, kpp=None):
    validate_inn(inn)
    if origin not in ('live-dadata', 'saved-response-unverified'):
        raise ValueError('Unknown response origin')
    if not isinstance(response, dict) or not isinstance(response.get('suggestions'), list):
        raise ValueError('Malformed registry response')
    if not isinstance(account, dict) or not account.get('id'):
        raise ValueError('An existing CRM account snapshot with id is required')
    if account.get('cInn') != inn:
        raise ValueError('CRM account INN must match the requested INN')
    parties = []
    for item in response['suggestions']:
        data = item.get('data') if isinstance(item, dict) else None
        if isinstance(data, dict) and data.get('inn') == inn and (not kpp or data.get('kpp') == kpp):
            parties.append(data)
    result = {
        'accountId': account['id'], 'inn': inn, 'origin': origin,
        'source': SOURCE, 'observedAt': observed_at,
        'status': 'not-found', 'suggestions': {}, 'emptyFieldPatch': {},
        'preservedFields': [], 'reviewRequired': True,
        'applied': False,
    }
    if not parties:
        if response['suggestions']:
            raise ValueError('Registry response contains no exact requested INN/KPP match')
        return result
    if len(parties) != 1:
        raise ValueError('Ambiguous registry match; specify KPP and review the source')
    party = parties[0]
    name = party.get('name') or {}
    address = party.get('address') or {}
    if not isinstance(name, dict) or not isinstance(address, dict):
        raise ValueError('Malformed registry party')
    candidates = {
        'name': name.get('short_with_opf') or name.get('full_with_opf'),
        # Keep the complete registry address; do not guess individual address components.
        'billingAddressStreet': address.get('unrestricted_value'),
    }
    for field, value in candidates.items():
        if not isinstance(value, str) or not value.strip():
            continue
        value = value.strip()
        result['suggestions'][field] = value
        existing = account.get(field)
        if existing is None or (isinstance(existing, str) and not existing.strip()):
            result['emptyFieldPatch'][field] = value
        else:
            result['preservedFields'].append(field)
    result['status'] = 'review'
    result['registryFacts'] = {
        key: party[key] for key in ('inn', 'kpp', 'ogrn')
        if isinstance(party.get(key), str)
    }
    # A completeness score is not a calibrated confidence or a company verification result.
    return result


def lookup(inn):
    key = os.environ.get('DADATA_API_KEY')
    if not key:
        raise ValueError('DADATA_API_KEY is not configured')
    request = urllib.request.Request(
        SOURCE, data=json.dumps({'query': validate_inn(inn), 'count': 20}).encode(),
        headers={'Authorization': 'Token ' + key, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        body = response.read(2 * 1024 * 1024 + 1)
    if len(body) > 2 * 1024 * 1024:
        raise ValueError('Registry response exceeded size limit')
    return json.loads(body)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inn', required=True)
    parser.add_argument('--kpp')
    parser.add_argument('--account', type=Path, required=True, help='CRM account JSON snapshot')
    parser.add_argument('--response', type=Path, help='Saved response; always labelled unverified')
    args = parser.parse_args()
    try:
        validate_inn(args.inn)
        account = json.loads(args.account.read_text())
        origin = 'saved-response-unverified' if args.response else 'live-dadata'
        response = json.loads(args.response.read_text()) if args.response else lookup(args.inn)
        preview = build_preview(
            args.inn, response, account,
            observed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            origin=origin, kpp=args.kpp,
        )
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        return 0
    except urllib.error.HTTPError as error:
        print('Registry request failed: HTTP ' + str(error.code), file=sys.stderr)
    except urllib.error.URLError:
        print('Registry connection failed; no data applied', file=sys.stderr)
    except (ValueError, OSError):
        # Never echo provider payloads, local paths or credentials in operational errors.
        print('Preview rejected: check INN, account identity and registry response; no data applied', file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
