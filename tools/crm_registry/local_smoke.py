"""Exercise a registry preview against the isolated local EspoCRM; fixture source only."""
import base64
import json
import os
from pathlib import Path
import urllib.error
import urllib.request
import uuid

from preview import build_preview

BASE = 'http://127.0.0.1:8090/api/v1/'
AUTH = base64.b64encode(('researcher:' + os.environ['ESPO_RESEARCH_PASSWORD']).encode()).decode()


def api(path, data=None):
    request = urllib.request.Request(
        BASE + path, data=None if data is None else json.dumps(data).encode(),
        headers={'Authorization': 'Basic ' + AUTH, 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, None


status, metadata = api('Metadata')
assert status == 200, 'Cannot inspect native metadata'
fields = metadata['entityDefs']['Account']['fields']
if 'cInn' not in fields:
    status, _ = api('Admin/fieldManager/Account', {
        'name': 'inn', 'type': 'varchar', 'maxLength': 12, 'label': 'ИНН', 'audited': True,
    })
    assert status in (200, 201), 'Native custom field creation failed: ' + str(status)
status, field = api('Admin/fieldManager/Account/cInn')
assert status == 200 and field.get('type') == 'varchar', 'Incompatible existing INN field'
status, created = api('Account', {'name': 'Synthetic registry preview ' + uuid.uuid4().hex[:12],
                                  'cInn': '7707083893'})
assert status in (200, 201)
status, before = api('Account/' + created['id'])
assert status == 200 and before['cInn'] == '7707083893'
result = build_preview('7707083893', {'suggestions': [{'data': {
    'inn': '7707083893', 'name': {'short_with_opf': 'SYNTHETIC registry fixture'},
    'address': {'unrestricted_value': 'SYNTHETIC address; not an actual registry result'},
}}]}, before, observed_at='2026-10-29T00:00:00+00:00', origin='saved-response-unverified')
assert result['emptyFieldPatch'] == {'billingAddressStreet': 'SYNTHETIC address; not an actual registry result'}
status, after = api('Account/' + created['id'])
assert status == 200 and before['name'] == after['name']
assert before.get('billingAddressStreet') == after.get('billingAddressStreet')
output = {'result': 'PASS', 'fixtureSourceOnly': True, 'liveRegistryVerified': False,
          'checks': ['native cInn field', 'CRM account INN roundtrip', 'preview of empty field',
                     'manager name preserved', 'no address write'], 'preview': result}
Path('/workspace/research/espo-runtime/registry-preview-result.json').write_text(
    json.dumps(output, ensure_ascii=False, indent=2))
print('PASS: native cInn + real local CRM snapshot + synthetic-source preview; no registry data applied')
