"""Replay committed migrations in a disposable local Compose PostgreSQL database."""
import json
from pathlib import Path
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[1]
DATABASE = 'notes_migration_test_' + uuid.uuid4().hex


def sql(statement, database=DATABASE):
    result = subprocess.run(
        ['docker', 'compose', 'exec', '-T', 'postgres', 'psql', '-X', '-v',
         'ON_ERROR_STOP=1', '-U', 'saas', '-d', database, '-At'],
        input=statement, text=True, capture_output=True, cwd=ROOT, check=True,
    )
    return result.stdout.strip()


sql(f'CREATE DATABASE {DATABASE}', 'saas')
try:
    migrations = sorted((ROOT / 'apps/api/prisma/migrations').glob('*/migration.sql'))
    for migration in migrations:
        sql(migration.read_text())
    columns = json.loads(sql("""
        SELECT json_object_agg(column_name, data_type || ':' || is_nullable)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contact_notes';
    """))
    expected = {
        'id': 'uuid:NO', 'tenantId': 'uuid:NO', 'organizationId': 'uuid:NO',
        'contactId': 'uuid:NO', 'body': 'text:NO', 'createdById': 'uuid:YES',
        'createdAt': 'timestamp without time zone:NO',
        'updatedAt': 'timestamp without time zone:NO',
    }
    assert columns == expected, (columns, expected)
    indexes = sql("SELECT indexname FROM pg_indexes WHERE tablename='contact_notes'")
    for name in ['contact_notes_pkey', 'contact_notes_contactId_idx',
                 'contact_notes_organizationId_idx']:
        assert name in indexes, name

    note_id, tenant_id, organization_id, contact_id = [str(uuid.uuid4()) for _ in range(4)]
    sql(f"""INSERT INTO contact_notes
        (id, "tenantId", "organizationId", "contactId", body, "updatedAt")
        VALUES ('{note_id}', '{tenant_id}', '{organization_id}', '{contact_id}',
                'Existing manager note', CURRENT_TIMESTAMP)""")
    assert sql(f"SELECT body FROM contact_notes WHERE id='{note_id}'") == 'Existing manager note'
    created_at = sql(f'SELECT "createdAt" FROM contact_notes WHERE id=\'{note_id}\'')
    assert created_at, 'createdAt default missing'

    # Reproduce an existing schema-synced installation with retained note data.
    sql((ROOT / 'apps/api/prisma/migrations/20261028160000_contact_notes/migration.sql').read_text())
    assert sql('SELECT count(*) FROM contact_notes') == '1'
    assert sql(f"SELECT body FROM contact_notes WHERE id='{note_id}'") == 'Existing manager note'
    print(f'PASS: {len(migrations)} migrations, ContactNote schema/indexes, insert/read, existing-data preservation')
finally:
    # Only this invocation's randomly named test database is removed.
    sql(f'DROP DATABASE {DATABASE}', 'saas')
