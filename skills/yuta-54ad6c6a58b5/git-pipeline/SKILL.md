---
name: git-pipeline
description: Git一括パイプラインスキル。stage → commit → push → PR を一括実行する。統合元: git-commit + yeet。トリガー: 「commitして」「pushして」「PR作成」「git操作」「デプロイして」「マージして」
version: 1.0.0
---

# Git Pipeline - Git一括パイプライン

このスキルは、Git操作を一括パイプラインとして実行し、開発ワークフローを効率化する。

## 概要

```
変更検出 → ステージング → コミット → プッシュ → PR作成
```

## トリガー

以下のキーワードで自動的にこのスキルが適用される：
- 「commitして」「コミットして」
- 「pushして」「プッシュして」
- 「PR作成」「プルリクエスト」
- 「git操作」「git」
- 「デプロイして」
- 「マージして」

## ワークフロー

### Step 1: 変更検出

現在のリポジトリ状態を確認：

```bash
git status
```

**表示内容**:
- 変更されたファイル一覧
- 新規ファイル
- 削除されたファイル
- 現在のブランチ

### Step 2: ステージング

変更内容をステージング：

**パターンA: 全変更をステージ**
```bash
git add .
```

**パターンB: 選択的ステージ**
```bash
git add [ファイル1] [ファイル2]
```

**パターンC: 対話的ステージ**
```
以下の変更があります：
1. [ファイル1] - modified
2. [ファイル2] - new file
3. [ファイル3] - deleted

→ ステージするファイルを選択 [all/1,2,3/manual]
```

### Step 3: コミット

コミットメッセージの作成：

**自動生成ルール**:
- 変更内容から適切なプレフィックスを選択
- 簡潔で説明的なメッセージ

| プレフィックス | 使用場面 |
|--------------|---------|
| `feat:` | 新機能追加 |
| `fix:` | バグ修正 |
| `docs:` | ドキュメント更新 |
| `style:` | フォーマット変更 |
| `refactor:` | リファクタリング |
| `test:` | テスト追加・修正 |
| `chore:` | その他の変更 |

詳細は [commit-conventions.md](references/commit-conventions.md) を参照。

**コミット実行**:
```bash
git commit -m "[プレフィックス]: [変更内容]"
```

### Step 4: プッシュ

リモートにプッシュ：

```bash
git push origin [ブランチ名]
```

**初回プッシュ**:
```bash
git push -u origin [ブランチ名]
```

### Step 5: PR作成

プルリクエストを作成：

```bash
gh pr create --title "[タイトル]" --body "[内容]"
```

PRテンプレートは [pr-template.md](references/pr-template.md) を参照。

---

## オプション

### --dry-run

実行せずプレビューのみ表示：

```
🔍 Dry Run Mode

[1] 変更ファイル: 3個
    - src/main.py (modified)
    - src/utils.py (modified)
    - README.md (modified)

[2] コミットメッセージ:
    "feat: AI機能の追加"

[3] プッシュ先:
    origin/feature/ai-function

[4] PR情報:
    タイトル: feat: AI機能の追加
    ベース: main

→ 実行する場合は --dry-run を外してください
```

### --no-pr

PR作成をスキップ：

```
git add . && git commit -m "..." && git push origin [branch]
```

### --amend

直前のコミットに修正：

```bash
git add [ファイル]
git commit --amend --no-edit
git push origin [branch] --force
```

⚠️ 注意: force pushは他の開発者に影響する可能性があります

---

## 使用例

### 例1: 基本的な一括実行

```
ユーザー: commitしてpushして

→ 🔍 変更を検出中...
   
   変更ファイル:
   - agent_a.py (modified)
   - agent_b.py (new)
   
   → ステージング: 2ファイル
   → コミットメッセージ: "feat: エージェント機能の追加"
   
   実行しますか？ [y/n]
   
ユーザー: y

→ ✅ コミット完了: abc1234
→ ✅ プッシュ完了: origin/main
```

### 例2: PR作成を含む

```
ユーザー: PR作成して

→ 🔍 現在のブランチ: feature/new-ai
   
   変更ファイル:
   - src/ai_engine.py (modified)
   - tests/test_ai.py (new)
   
   → コミットメッセージ: "feat: AIエンジンの実装"
   → プッシュ先: origin/feature/new-ai
   → PRタイトル: feat: AIエンジンの実装
   → ベースブランチ: main
   
   実行しますか？ [y/n]
   
ユーザー: y

→ ✅ コミット完了
→ ✅ プッシュ完了
→ ✅ PR作成完了: https://github.com/xxx/pull/42
```

### 例3: ドライラン

```
ユーザー: commitして（dry-run）

→ 🔍 Dry Run Mode
   
   [プレビューのみ]
   - ステージ: 3ファイル
   - コミット: "fix: バグ修正"
   - プッシュ: origin/main
   
   → 実際には何も変更されていません
```

---

## 対話的モード

デフォルトでは各ステップで確認を表示：

```
📦 Git Pipeline

[Step 1/5] 変更検出
  変更ファイル: 3個
  
[Step 2/5] ステージング
  → どのファイルをステージしますか？ [all/select]
  
[Step 3/5] コミット
  提案メッセージ: "feat: 新機能追加"
  → このメッセージでよいですか？ [y/edit]
  
[Step 4/5] プッシュ
  → プッシュしますか？ [y/n]
  
[Step 5/5] PR作成
  → PRを作成しますか？ [y/n/skip]
```

---

## エラーハンドリング

### マージコンフリクト

```
⚠️ マージコンフリクトが発生

競合ファイル:
- src/main.py

解決方法:
1. ファイルを開いてコンフリクトを解決
2. git add src/main.py
3. git commit

→ コンフリクト解決後に再実行してください
```

### 認証エラー

```
❌ 認証エラー

Git認証情報が無効です。

解決方法:
- gh auth login
- またはSSH鍵を設定
```

### ブランチが存在しない

```
❌ リモートブランチが存在しません

→ 新規ブランチとしてプッシュしますか？ [y/n]
```

---

## References

- [Commit Conventions](references/commit-conventions.md) - コミットメッセージ規約
- [PR Template](references/pr-template.md) - PRテンプレート

## Scripts

- [detect-changes.mjs](scripts/detect-changes.mjs) - 変更ファイル検出
- [stage-selective.mjs](scripts/stage-selective.mjs) - 選択的ステージング
- [create-pr.mjs](scripts/create-pr.mjs) - PR作成
