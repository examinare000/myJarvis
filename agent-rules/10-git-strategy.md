# 10. Git戦略

## 🚨 必須ルール: Git戦略の統一仕様

### ブランチ戦略

#### 基本原則
- **1ブランチ = 1目的**: 各ブランチは単一明確な目的を持つ
- **目的の混在禁止**: 異なる目的は別ブランチで実装
- **保護ブランチ**: master、main、developブランチへの直接コミット禁止
- **フィーチャーブランチワークフロー**: すべての開発はフィーチャーブランチで

#### ブランチ構成

**メインブランチ:**
- **`main`**: プロダクション準備完了コードのみ
  - リリースタグのみ
  - 直接コミット禁止
  - 安定バージョンを維持

- **`develop`**: 統合開発ブランチ
  - 全ての開発はここで実施
  - feature ブランチからのマージ先
  - 日常的な開発作業の基点

**サポートブランチ:**
- **`feature/xxx`**: 新機能開発
  - developから分岐
  - developにマージ
  - 機能完了後削除

- **`hotfix/xxx`**: 緊急修正
  - mainから分岐
  - mainとdevelopの両方にマージ

- **`release/xxx`**: リリース準備
  - developから分岐
  - mainとdevelopの両方にマージ

### Claude Code動作制約

#### 開発開始時の必須チェック
```bash
# 必ず現在のブランチを確認
git branch
git status

# developブランチにいることを確認してから作業開始
git checkout develop
git pull origin develop
```

#### 新機能開発フロー
```bash
# developから新機能ブランチを作成
git checkout develop
git checkout -b feature/feature-name

# 開発実施（アトミックコミット）
git add specific_file.py
git commit -m "機能: 新機能の特定部分を実装"

# 完了後developにマージ
git checkout develop
git merge --ff-only feature/feature-name
git branch -d feature/feature-name
```

#### リリース準備フロー
```bash
# developからリリースブランチを作成
git checkout develop
git checkout -b release/v1.2.0

# リリース準備（バージョン更新、最終テスト等）
git add version_file
git commit -m "設定: v1.2.0リリースのためバージョンを更新"

# mainにマージ
git checkout main
git merge --ff-only release/v1.2.0

# タグ作成
git tag -a v1.2.0 -m "リリース v1.2.0"

# developに変更を反映
git checkout develop
git merge --ff-only release/v1.2.0
git branch -d release/v1.2.0
```

#### 緊急修正フロー
```bash
# mainから緊急修正ブランチを作成
git checkout main
git checkout -b hotfix/critical-bug-fix

# 修正実施
git add fixed_file.py
git commit -m "修正: 緊急修正 - セキュリティホールを修正"

# mainとdevelopの両方にマージ
git checkout main
git merge --ff-only hotfix/critical-bug-fix

git checkout develop
git merge --ff-only hotfix/critical-bug-fix

git branch -d hotfix/critical-bug-fix
```

### マージ戦略

#### Fast-Forward-Only原則
- **`--ff-only` 必須**: すべてのマージでfast-forwardを強制
- **履歴の線形化**: ブランチの履歴を線形に保つ
- **マージコミット禁止**: 不要なマージコミットを作成しない

```bash
# ✅ 正しいマージ
git merge --ff-only feature/new-feature

# ❌ 禁止されたマージ
git merge feature/new-feature  # マージコミットが作成される
git merge --no-ff feature/new-feature  # 明示的にマージコミット作成
```

#### Rebaseの活用
```bash
# feature作業中にdevelopが更新された場合
git checkout feature/my-feature
git rebase develop

# コンフリクト解決後
git rebase --continue

# developにマージ（fast-forwardになる）
git checkout develop
git merge --ff-only feature/my-feature
```

### 緊急事態対応

#### mainブランチに誤ってコミットした場合
```bash
# 最後のコミットを取り消してdevelopに移動
git reset --soft HEAD~1
git stash

git checkout develop
git stash pop

git add -A
git commit -m "移動: mainから誤ってコミットした変更をdevelopに移動"
```

#### 間違ったブランチで作業した場合
```bash
# 現在のブランチで作業内容をstash
git stash

# 正しいブランチに移動
git checkout correct-branch

# 作業内容を復元
git stash pop

# 通常のコミット手順を実行
git add -A
git commit -m "機能: 正しいブランチで機能を実装"
```

### コミット品質管理

#### アトミックコミットの徹底
```bash
# ❌ 悪い例：複数の変更を1つのコミットに
git add .
git commit -m "機能追加とバグ修正と設定変更"

# ✅ 良い例：変更を分割
git add src/new_feature.py tests/test_new_feature.py
git commit -m "機能: 新機能XYZを実装"

git add src/bug_fix.py
git commit -m "修正: ユーザー認証のバグを解決"

git add config/settings.yaml
git commit -m "設定: 本番環境用の設定を追加"
```

#### コミットメッセージの品質
```bash
# ✅ 良いコミットメッセージ
git commit -m "機能: ユーザープロフィール編集機能を実装"
git commit -m "修正: パスワードリセット時のメール送信エラーを解決"
git commit -m "改善: データベースクエリのパフォーマンスを最適化"
git commit -m "テスト: 認証機能の統合テストを追加"
git commit -m "削除: 使用されなくなった旧API関連コードを削除"

# ❌ 悪いコミットメッセージ
git commit -m "update"
git commit -m "fix bug"
git commit -m "WIP"
git commit -m "changes"
```

### 継続的統合との連携

#### プルリクエスト前チェック
```bash
# ローカルでの事前チェック
npm test              # または pytest, go test等
npm run lint          # または flake8, golint等
npm run typecheck     # または mypy, go vet等

# すべて通過後にプッシュ
git push origin feature/my-feature
```

#### 自動化可能なチェック
- **テスト自動実行**: すべてのブランチでテスト実行
- **静的解析**: lint、typecheck、セキュリティスキャン
- **依存関係チェック**: 脆弱性スキャン
- **コミットメッセージ検証**: 形式チェック

---

**適用優先度**: 🔴 最高（すべてのGit操作に適用必須）
**更新頻度**: プロジェクト規模に応じて見直し