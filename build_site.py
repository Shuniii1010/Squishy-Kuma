"""Build the complete static site expected by the GitHub Pages workflow.

Run from any directory: python build_site.py (or uv run build_site.py).
Only Python's standard library is needed. No Flask, npm or network is required.
"""
from pathlib import Path
import shutil
import tempfile

ROOT = Path(__file__).resolve().parent


def build_site(project_root: Path = ROOT) -> Path:
    """Export templates/index.html and bundled assets to project_root/site/."""
    root = Path(project_root).resolve()
    target = root / 'site'
    # Validate input before replacing the last successful build.
    html = (root / 'templates/index.html').read_bytes()
    assets = root / 'static'
    if not assets.is_dir():
        raise FileNotFoundError(f'Missing static assets: {assets}')
    if target.is_symlink() or (target.exists() and not target.is_dir()):
        raise ValueError(f'Build output must be a normal directory: {target}')

    with tempfile.TemporaryDirectory(prefix='.site-build-', dir=root) as temporary:
        staged = Path(temporary) / 'site'
        staged.mkdir()
        (staged / 'index.html').write_bytes(html)
        (staged / '.nojekyll').touch()
        shutil.copytree(assets, staged / 'static')
        # All source and dependencies are ready before removing old output.
        if target.exists():
            shutil.rmtree(target)
        staged.replace(target)
    return target


if __name__ == '__main__':
    site = build_site()
    print(f'Built {site / "index.html"}')
    print('Preview over HTTP: python -m http.server 8000 --directory site')
