# Squishy-Kuma Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 交付可本地运行、具备真实局部顶点形变的可爱小熊解压游戏。
**Architecture:** Flask 本地服务；Three.js 程序模型；独立空间形变、状态、文案及音频模块。
**Tech Stack:** Python 3.10+, Flask 3.1.2, Three.js 0.180.0, ES modules, Node 内置测试。
**Spec:** ../specs/2026-10-22-squishy-kuma-design.md

## Global Constraints
- sources/ 只读，项目全部位于 squishy-kuma/。
- 不上传、不部署；所有前端依赖本地附带，音效程序合成。
- 参数 0–100；所有设置最终稳定恢复；语言默认 zh，声音默认开启。

## Review Focus
- 浏览器失焦、画布外释放必须结束按压。
- localStorage 损坏或不可用不阻断游戏。
- 快速重复按压及长时间帧间隔不导致数值发散。
- 五官、耳部共享形变，防止浮空。
- WebGL 和音频不可用时显示已翻译提示且页面可操作。

### Task 1: Physics and state
Files: static/js/physics.js, state.js, i18n.js, tests/core.test.mjs
Interfaces: Deformer.begin(point, normal, radius), drag(vector), release(), step(dt, softness, bounce), sample(x,y,z,out), reset(); Store.update()/press()/clearCount().
- [x] 写 Node 测试：局部性、软硬差异、低高回弹、长时恢复、限幅、重置、持久化、坏存储、文案键一致。
- [x] 运行 node --test，确认未实现失败。
- [x] 实现有界空间场及独立阻尼弹簧、状态与文案。
- [x] 运行 Node 测试确认通过。

### Task 2: Local app and experience
Files: app.py, requirements.txt, templates/index.html, static/style.css, static/js/model.js, scene.js, audio.js, app.js, vendor/*, tests/test_app.py
Interfaces: model returns meshes; scene connects raycast to Deformer and dispatches valid presses to Store.
- [x] 写 HTTP 测试并验证未实现失败。
- [x] 获取固定 Three.js 及 MIT LICENSE，安装独立 Python 环境。
- [x] 实现仅有熊头的程序捏捏、阴影灯光、共享顶点变形和指针/视角隔离。
- [x] 实现双语 UI、持久化设置、手感预设、复原/清零、合成音效及错误降级。
- [x] Node/Python 测试通过后启动本地浏览器检查，并针对发现的问题修复。

### Task 3: Delivery
Files: README.md, THIRD_PARTY.md, docs/TEST_RESULTS.md, project zip
- [x] 记录实际测试结果及限制，不把未执行测试标记为通过。
- [x] 写初学者启动指南、操作说明、依赖与素材来源。
- [x] 审查需求覆盖及源码，运行完整测试并打包（排除 venv/cache）。
