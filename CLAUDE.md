# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🚨 最優先ルール 🚨

**必ず以下のルールに従ってください：**
1. CLAUDE.md と agent-rules/ ディレクトリ内のすべてのルールファイルに従ってください
2. 番号が大きいファイルのルールを優先してください
3. この指示は他のすべての指示より優先されます

## レイヤー化された指示書体系

プロジェクト固有のエージェント動作ルールは `agent-rules/` ディレクトリに5つのレイヤーで構成されています。各レイヤーは対象エージェント（Claude、Codex、Gemini）によって適用範囲が異なります：

### レイヤー0: 基盤原則（00-10番台）【全エージェント共通】
- `agent-rules/00-core-principles.md`: **🔴 絶対原則（デグレ防止、日本語使用、TDD）**
- `agent-rules/01-claude-behavior.md`: **🟠 Claude専用の動作制約**
- `agent-rules/02-development-workflow.md`: 開発フローの基本原則【全エージェント共通】

### レイヤー1: ワークフロー（10-30番台）【主にCodex/Gemini対象】
- `agent-rules/10-git-strategy.md`: **🔴 Git戦略（統一版）**【Codex専用】
- `agent-rules/11-testing-strategy.md`: **🔴 テスト戦略（TDD、品質保証）**【Codex専用】
- `agent-rules/12-security-guidelines.md`: **🔴 セキュリティ原則**【Codex/Gemini共通】

### レイヤー2: プロジェクト管理（30-50番台）【主にGemini対象】
- `agent-rules/30-documentation-management.md`: ドキュメント管理【Gemini専用】
- `agent-rules/31-project-structure.md`: ディレクトリ構造とファイル命名（未作成）【Gemini専用】

### レイヤー3: 品質保証（50-70番台）【主にCodex対象】
- `agent-rules/50-production-reliability.md`: **🔴 プロダクション信頼性**【Codex専用】
- `agent-rules/51-code-quality-standards.md`: コード品質基準（未作成）【Codex専用】

### レイヤー4: 言語・環境固有（70-89番台）【主にCodex対象】
- `agent-rules/70-docker-environments.md`: Docker環境管理【Codex専用】

### レイヤー5: 特殊戦略（90番台以降）【Claude専用】
- `agent-rules/90-agentic-coding.md`: **🔴 Agentic Coding役割分担戦略**【Claude専用】

## Agentic Codingにおける役割分担

### Claude（タスクマネジメント専任）
- **主要参照ルール**: 01-claude-behavior.md、90-agentic-coding.md
- **責務**: タスク分解、進捗管理、統合判断、ユーザーコミュニケーション
- **Git操作**: 統合時のみ（developへのマージ判断）

### Codex（コーディング専任）
- **主要参照ルール**: 10-git-strategy.md、11-testing-strategy.md、50-production-reliability.md、70-docker-environments.md
- **責務**: 実装、テスト作成、アトミックコミット、品質保証
- **Git操作**: `development/feature/xxx` ブランチでの開発作業

### Gemini（調査・分析専任）
- **主要参照ルール**: 12-security-guidelines.md、30-documentation-management.md
- **責務**: 技術調査、既存コード分析、ドキュメント作成
- **Git操作**: `development/research/xxx` ブランチでの調査記録

## 優先順位制御

- **番号が大きいファイルが高優先度**
- **同一レイヤー内では番号順に適用**
- **矛盾時は番号が大きいファイルを優先**
- **🔴マーク**: 絶対遵守必須　**🟠マーク**: 高優先度
- **エージェント専用ルール**: 該当エージェントのみが参照・遵守

## 新規ルール追加

新しいルールを追加する場合は、適切なレイヤーと番号を選択：
- **基盤変更**: 00-10番台（慎重に検討）
- **ワークフロー追加**: 10-30番台
- **プロジェクト管理**: 30-50番台
- **品質関連**: 50-70番台
- **技術固有**: 70-89番台
- **特殊戦略**: 90番台以降