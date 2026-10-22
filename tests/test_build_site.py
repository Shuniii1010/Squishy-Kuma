"""Regression checks for the exact site/ artifact expected by pages.yml."""
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'build_site.py'

class AssetLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {'script', 'link'}:
            ref = attrs.get('src') or attrs.get('href')
            if ref and not ref.startswith('data:'):
                self.links.append(ref)

class PagesBuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name) / 'game'
        self.project.mkdir()
        shutil.copytree(ROOT / 'templates', self.project / 'templates')
        shutil.copytree(ROOT / 'static', self.project / 'static')
        spec = importlib.util.spec_from_file_location('kuma_build', SCRIPT)
        self.module = None
        if SCRIPT.exists():
            self.module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(self.module)

    def build(self):
        self.assertTrue(callable(getattr(self.module, 'build_site', None)),
                        'build_site.py must provide the static Pages builder')
        return self.module.build_site(self.project)

    def test_builds_complete_artifact_without_python_runtime(self):
        source = (self.project / 'templates/index.html').read_bytes()
        site = self.build()
        self.assertEqual(site, (self.project / 'site').resolve())
        self.assertEqual((site / 'index.html').read_bytes(), source)
        self.assertTrue((site / '.nojekyll').is_file())
        self.assertTrue((site / 'static/vendor/THREE-LICENSE.txt').is_file())
        self.assertFalse(list(site.rglob('*.py')))
        self.assertEqual((self.project / 'templates/index.html').read_bytes(), source)

    def test_html_and_module_graph_resolve_under_any_repository_prefix(self):
        site = self.build()
        html = (site / 'index.html').read_text()
        parser = AssetLinks(); parser.feed(html)
        import_map = json.loads(re.search(r'<script type="importmap">(.*?)</script>', html, re.S).group(1))
        for prefix in ['/', '/A-Bit-Damp/', '/another-repository/squishy-kuma/']:
            with self.subTest(prefix=prefix):
                seen = set()
                queue = [(prefix + 'index.html', link) for link in parser.links + list(import_map['imports'].values())]
                while queue:
                    parent, link = queue.pop()
                    self.assertTrue(link.startswith(('./', '../')), f'non-relative resource: {link}')
                    resolved = urljoin(parent, link)
                    self.assertTrue(resolved.startswith(prefix), resolved)
                    relative = resolved[len(prefix):]
                    asset = site / relative
                    self.assertTrue(asset.is_file(), resolved)
                    if relative in seen or asset.suffix != '.js':
                        continue
                    seen.add(relative)
                    script = re.sub(r'/\*.*?\*/', '', asset.read_text(), flags=re.S)
                    script = re.sub(r'^\s*//.*$', '', script, flags=re.M)
                    for dependency in re.findall(r'(?:from\s*|import\s*\()([\"\'])(.*?)\1', script):
                        queue.append((resolved, dependency[1]))
                self.assertIn('static/js/scene.js', seen)
                self.assertIn('static/vendor/three.core.min.js', seen)

    def test_rebuild_removes_stale_output_but_preserves_source(self):
        site = self.build()
        (site / 'obsolete.txt').write_text('old build')
        (self.project / 'keep.txt').write_text('source')
        self.build()
        self.assertFalse((site / 'obsolete.txt').exists())
        self.assertEqual((self.project / 'keep.txt').read_text(), 'source')

    def test_missing_source_does_not_destroy_previous_build(self):
        site = self.build(); previous = (site / 'index.html').read_bytes()
        (self.project / 'templates/index.html').unlink()
        with self.assertRaises(FileNotFoundError):
            self.build()
        self.assertEqual((site / 'index.html').read_bytes(), previous)

    def test_standalone_build_uses_script_directory_and_needs_only_stdlib(self):
        self.assertTrue(SCRIPT.exists(), 'missing build_site.py')
        script = self.project / 'build_site.py'
        shutil.copy2(SCRIPT, script)
        # -I -S excludes local imports, PYTHONPATH and installed site-packages.
        result = subprocess.run([sys.executable, '-I', '-S', str(script)], cwd=self.temp.name,
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.project / 'site/index.html').is_file())
        self.assertFalse((Path(self.temp.name) / 'site').exists())

    def test_workflow_runs_the_builder_and_uploads_site(self):
        workflow = ROOT / '.github/workflows/pages.yml'
        self.assertTrue(workflow.is_file(), 'missing ready-to-upload workflow')
        text = workflow.read_text()
        self.assertIn('run: uv run build_site.py', text)
        self.assertIn('path: site', text)
        self.assertIn('needs: build', text)
        self.assertIn('pages: write', text)
        self.assertIn('id-token: write', text)

if __name__ == '__main__':
    unittest.main()
