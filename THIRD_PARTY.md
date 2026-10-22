# 依赖与素材来源

## Three.js 0.180.0 / OrbitControls

- 官方项目：[mrdoob/three.js](https://github.com/mrdoob/three.js/tree/r180)
- 获取地址（仅开发时下载，运行时读取本地文件）：
  - https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js
  - https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.core.min.js
  - https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js
  - https://cdn.jsdelivr.net/npm/three@0.180.0/LICENSE
- 文件在 `static/vendor/`；`three.module.min.js` 本地文件名为 `three.module.js`。OrbitControls 中唯一的依赖导入改为 `./three.module.js`，便于本地浏览器与 Node 测试共用。
- MIT 许可证允许使用、修改及再分发，需保留版权及许可声明；完整原文在 `static/vendor/THREE-LICENSE.txt`。

## Flask

- 固定版本 3.1.2，Python 包管理器安装。
- 官方项目：https://github.com/pallets/flask/tree/3.1.2
- BSD-3-Clause；依赖未复制入源码包，由 pip 获取并保留各自许可。

## 模型、界面和音效

- 熊头、耳朵、五官由 `model.js` 生成；无外部模型、贴图或字体下载。
- 模型外观参考用户提供的轻松熊造型照片。未把原照片作为网页素材或复制进项目压缩包。
- 轻松熊 / Rilakkuma 为 San-X 的角色；本项目不附带角色品牌商业授权。角色相关商业用途应另行取得权利人授权。
- 音效由 Web Audio 振荡器、滤波器和增益包络合成，没有使用外部录音。
- 页面小图标为代码内 SVG，地面接触阴影由 Canvas 程序生成。字体使用系统字体。

## 实现参考

- Three.js BufferGeometry 官方文档：https://threejs.org/docs/#api/en/core/BufferGeometry
- Three.js OrbitControls 官方文档：https://threejs.org/docs/#examples/en/controls/OrbitControls
- Flask 官方快速开始：https://flask.palletsprojects.com/en/stable/quickstart/
