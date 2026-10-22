import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class LocalAppTests(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('kuma_app', ROOT / 'app.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.client = module.app.test_client()

    def test_page_and_all_local_modules_are_served(self):
        page = self.client.get('/')
        self.assertEqual(page.status_code, 200)
        self.assertIn('轻松熊捏捏乐', page.get_data(as_text=True))
        for asset in ['style.css', 'js/app.js', 'js/physics.js', 'js/model.js', 'js/scene.js',
                      'js/state.js', 'js/i18n.js', 'js/audio.js', 'js/camera.js', 'vendor/three.module.js',
                      'vendor/three.core.min.js', 'vendor/OrbitControls.js']:
            with self.subTest(asset=asset):
                response = self.client.get('/static/' + asset)
                self.assertEqual(response.status_code, 200)
                self.assertGreater(len(response.data), 100)
                response.close()

    def test_no_external_runtime_dependencies(self):
        page = self.client.get('/').get_data(as_text=True)
        self.assertNotRegex(page, r'(src|href)=[\"\']https?://')
        self.assertEqual(self.client.get('/missing').status_code, 404)

if __name__ == '__main__':
    unittest.main()
