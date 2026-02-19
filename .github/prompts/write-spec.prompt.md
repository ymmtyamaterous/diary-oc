---
name: write-spec
description: " docs/user/draft.md の簡易仕様書をもとに、docs/agent/spec.md を作成"
model: Claude Sonnet 4.5 (copilot)
tools: ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'agent', 'todo']
---

# 指示内容

- `docs/user/draft.md` には最低限の機能や仕様が書かれている
- この他に実装する必要のある機能等あれば追加して、 `docs/agent/spec.md` として出力する
