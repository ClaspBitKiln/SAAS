"""Generate unique local REA fixture names without changing the saved evidence."""
import json
from pathlib import Path
import sys
import uuid

source, target = map(Path, sys.argv[1:3])
scenario = json.loads(source.read_text())
name = 'REA Pilot ' + uuid.uuid4().hex[:12]
for action in scenario['actions']:
    if action['step_id'] == 'company-name-fill':
        action['value']['value'] = name
    if action['step_id'] == 'company-email':
        action['value']['value'] = 'pilot-'+name.split()[-1]+'@example.test'
    if action['step_id'] == 'reopen-company':
        action['locator']['name'] = name
assert source.resolve() != target.resolve(), 'Preserve the original scenario'
target.write_text(json.dumps(scenario, indent=2))
print('Generated scenario with unique synthetic company name')
