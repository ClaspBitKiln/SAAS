import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from preview import build_preview, validate_inn

INN = '7707083893'


class RegistryPreviewTests(unittest.TestCase):
    def setUp(self):
        self.account = {'id': 'synthetic-account', 'cInn': INN, 'name': 'Manager name', 'billingAddressStreet': ''}
        self.party = {'inn': INN, 'kpp': '123456789', 'ogrn': 'synthetic-ogrn',
                      'name': {'short_with_opf': 'Synthetic registry name'},
                      'address': {'unrestricted_value': 'Synthetic registry address'}}
        self.response = {'suggestions': [{'data': self.party}]}

    def build(self, response=None, account=None, **kwargs):
        return build_preview(INN, self.response if response is None else response,
                             self.account if account is None else account,
                             observed_at='2026-10-29T00:00:00+00:00',
                             origin='saved-response-unverified', **kwargs)

    def test_fills_only_empty_address_preserving_manager_name(self):
        original = copy.deepcopy(self.account)
        result = self.build()
        self.assertEqual(result['emptyFieldPatch'], {'billingAddressStreet': 'Synthetic registry address'})
        self.assertEqual(result['preservedFields'], ['name'])
        self.assertEqual(self.account, original)
        self.assertFalse(result['applied'])
        self.assertTrue(result['reviewRequired'])

    def test_does_not_overwrite_existing_address(self):
        self.account['billingAddressStreet'] = 'Manager verified address'
        self.assertEqual(self.build()['emptyFieldPatch'], {})

    def test_does_not_invent_phone_email_website_or_confidence(self):
        result = self.build()
        for key in ['phoneNumber', 'emailAddress', 'website', 'confidence']:
            self.assertNotIn(key, result['suggestions'])
        self.assertEqual(result['origin'], 'saved-response-unverified')

    def test_checksum_and_ascii_validation(self):
        self.assertEqual(validate_inn(INN), INN)
        self.assertEqual(validate_inn('500100732259'), '500100732259')
        for invalid in ['7707083894', '0000000000', '１２３４５６７８９０', 7707083893, '123']:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                validate_inn(invalid)

    def test_foreign_crm_account_is_rejected(self):
        self.account['cInn'] = '500100732259'
        with self.assertRaises(ValueError):
            self.build()

    def test_missing_crm_inn_is_rejected(self):
        del self.account['cInn']
        with self.assertRaises(ValueError):
            self.build()

    def test_mismatched_provider_inn_is_rejected(self):
        self.party['inn'] = '500100732259'
        with self.assertRaises(ValueError):
            self.build()

    def test_ambiguous_branches_require_kpp(self):
        branch = copy.deepcopy(self.party)
        branch['kpp'] = '987654321'
        self.response['suggestions'].append({'data': branch})
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual(self.build(kpp='987654321')['registryFacts']['kpp'], '987654321')

    def test_empty_result_does_not_propose_patch(self):
        result = self.build(response={'suggestions': []})
        self.assertEqual(result['status'], 'not-found')
        self.assertEqual(result['emptyFieldPatch'], {})

    def test_missing_values_do_not_become_facts(self):
        del self.party['address']
        self.assertEqual(self.build()['emptyFieldPatch'], {})

    def test_malformed_data_is_rejected(self):
        for payload in [{}, {'suggestions': 'not a list'}, {'suggestions': [None]}]:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                self.build(response=payload)

    def test_saved_response_cli_is_explicitly_unverified(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory)
            (p/'account.json').write_text(json.dumps(self.account))
            (p/'response.json').write_text(json.dumps(self.response))
            run = subprocess.run([sys.executable, str(Path(__file__).with_name('preview.py')),
                                  '--inn', INN, '--account', str(p/'account.json'),
                                  '--response', str(p/'response.json')], capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertEqual(json.loads(run.stdout)['origin'], 'saved-response-unverified')


if __name__ == '__main__':
    unittest.main()
