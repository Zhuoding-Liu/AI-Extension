# PageFlow AI

一个无需构建步骤的 Chrome / Edge Manifest V3 网页辅助扩展。它可以按网站保存显示偏好，并为后续 AI 页面定制预留了兼容 API 接口。

## 当前功能

- 原始、护眼、深色、高对比四种页面氛围
- 一键隐藏图片、图片灰度、易读字体、突出链接
- 阅读聚焦、减少动画、字体大小、行距、饱和度和阅读宽度
- 每个网站独立保存设置，一键恢复
- 中文/英文自然语言本地快捷规则
- 可选的 Chat Completions 兼容 API 接入

## 安装与测试

1. 打开 Chrome 的 `chrome://extensions/`，或 Edge 的 `edge://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择本目录 `AI Extension`。
4. 打开任意普通网页并刷新一次，然后点击工具栏中的 PageFlow AI。

修改代码后，在扩展管理页点击该扩展的“重新加载”，再刷新测试网页。

## AI 接入

点击弹窗底部“AI 接入设置”，填写一个支持 OpenAI Chat Completions 请求/响应结构的接口地址。推荐填写你自己的后端代理地址，并让代理保存服务商密钥。直接在扩展里保存 API Key 仅适合个人开发测试，因为本机用户可以读取扩展存储。

AI 返回值应是一个 JSON 对象，例如：

```json
{
  "theme": "warm",
  "fontScale": 120,
  "lineHeight": 1.8,
  "hideImages": true,
  "reduceMotion": true
}
```

允许字段与范围记录在 `service-worker.js` 的系统提示中，实际应用前还会由 `content-script.js` 校验。

## 文件结构

- `manifest.json`：扩展声明与权限
- `popup.*`：工具栏弹窗界面和交互
- `content-script.js`：页面样式控制、状态校验与按网站存储
- `service-worker.js`：AI 服务适配层
- `options.*`：AI 接口配置页

## 发布前建议

- 使用后端代理鉴权，不把第三方 API Key 分发到客户端。
- 将宽泛的网站访问能力改成“用户点击后按需授权”，并准备隐私政策。
- 在常见内容网站、单页应用、视频站和高对比度模式下进行兼容性测试。
