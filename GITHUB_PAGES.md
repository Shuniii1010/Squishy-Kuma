# 上传到 GitHub，自动生成小游戏网站

已适配你提供的 [pages.yml](https://github.com/Shuniii1010/A-Bit-Damp/blob/main/.github/workflows/pages.yml)：构建脚本生成 `site/index.html`，workflow 上传整个 `site/`，再由 GitHub Pages 发布。页面在浏览器运行，不需要线上 Python/Flask 服务。

## 1. 上传目录结构

下载 `squishy-kuma-github-pages.zip` 并解压。**把解压后的文件放在仓库根目录**，让结构如下：

```text
你的仓库/
├── .github/
│   └── workflows/
│       └── pages.yml
├── .gitignore
├── build_site.py
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   ├── js/
│   └── vendor/
├── app.py                    # 仅本地 Flask 模式使用
├── requirements.txt         # 仅本地 Flask 模式需要安装
├── README.md
├── GITHUB_PAGES.md
└── ...
```

不要只上传 ZIP 文件，也不要把所有文件再套在仓库下的 `squishy-kuma/` 文件夹内。工作流的默认工作目录是仓库根目录；根目录必须能找到 `build_site.py`。

`.github` 是隐藏目录，macOS Finder 可按 `Command+Shift+.` 显示。若用 GitHub 网页上传时漏掉该目录，可通过 **Add file → Create new file**，文件名输入 `.github/workflows/pages.yml`，复制本项目同名文件的内容。

若使用已有的 `A-Bit-Damp` 仓库，更新这个 workflow 后，Pages 首页将改为小游戏。原仓库的 `plot_web.py` 不用覆盖；本项目使用独立的 `build_site.py`。若希望原网站继续保持原样，可以给小游戏单独建立仓库，并使用同一份 workflow。

## 2. Workflow 具体改动

已附带可直接用的 `.github/workflows/pages.yml`，保留原 workflow 的 `main` 分支触发、手动触发、权限、构建/部署两个 job 和 `site` 上传目录。

构建命令从：

```yaml
run: uv run plot_web.py
```

改为：

```yaml
run: uv run build_site.py
```

构建脚本只依赖 Python 标准库，无需 pip 安装 Flask，也无需 npm install。Three.js 与控制器已经随源码附带。

脚本会生成：

```text
site/
├── index.html
├── .nojekyll
└── static/
    ├── style.css
    ├── js/...
    └── vendor/...
```

`site/` 是自动生成的产物，已加入 `.gitignore`，无需上传。每次 workflow 都会重新构建。

## 3. 在 GitHub 上启用

1. 把上述源码提交到仓库的 `main` 分支。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 打开 **Actions → Build Squishy-Kuma**，查看自动运行结果；也可以点击 **Run workflow** 手动运行。
4. `build` 和 `deploy` 均成功后，打开该运行结果中的部署链接。

一般的项目网站地址为 `https://你的用户名.github.io/仓库名/`。实际地址以 workflow 返回的部署链接为准。

页面资源全部使用相对路径，不需要把代码里的仓库名改成固定值；适用于 `/A-Bit-Damp/`、其他仓库名、根域名和更深的路径。

官方说明：[自定义 Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Pages 网站及地址](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## 4. 上传前在本机验证

在解压后的项目文件夹打开终端：

```bash
python3 build_site.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

Windows 将 `python3` 换为 `py`。然后打开 `http://127.0.0.1:8000/`，按 `Ctrl+C` 停止。

如果已安装 uv，也可用与 workflow 相同的命令：

```bash
uv run build_site.py
```

前端使用 ES modules，需通过 HTTP 预览；不能直接双击生成的 HTML 文件。

原来的 Flask 启动方式仍可用，见 `README.md`。网页上的捏捏、回弹、双语、声音和次数均在浏览器中完成，静态部署保留全部桌面游戏功能。

## 5. 检查失败时

- `build_site.py` 找不到：检查它是否在仓库根目录，及 workflow 是否改成新命令。
- 未触发工作流：检查推送分支是否为 `main`。若仓库使用其他默认分支，将 workflow 中的分支改为该分支。
- `deploy` 失败：检查 Pages 的 Source 是否选择 GitHub Actions；查看 Actions 的具体错误。附带 workflow 已包含 `pages: write`、`id-token: write` 以及 `github-pages` environment。
- 网页加载但模型不出现：检查整个 `static/`（尤其 `static/vendor/`）是否已上传；不要只上传首页。
- 线上次数与本地不同：正常。计数保存在访问者浏览器内，按站点来源区分。发布后不会把本机测试计数分享给别人。

此交付已在本地验证构建及仓库子路径加载；未代替你上传仓库或运行远端 GitHub Actions。上传后的真实部署状态以 Actions 为准。
