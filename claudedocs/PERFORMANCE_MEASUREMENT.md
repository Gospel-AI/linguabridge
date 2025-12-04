# ダッシュボードパフォーマンス測定ガイド

## 📊 測定方法

### 1. ブラウザDevToolsでネットワークを確認

1. **Chrome DevToolsを開く**: `F12` または `Cmd+Option+I` (Mac)
2. **Networkタブを選択**
3. **キャッシュをクリア**: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
4. **ダッシュボードページを読み込む**: `/dashboard`
5. **リクエスト数を確認**:
   - `/api/workers/me` - **1回のみ** (以前は3回)
   - `/api/tasks` - 1回
   - `/api/applications` - 1回
   - `/api/tasks/batch-applications` - **1回** (以前はタスク数×N回)

### 2. パフォーマンスタイムラインを測定

1. **DevTools → Performanceタブ**
2. **Record開始** (⚫️ボタン)
3. **ダッシュボードページをリロード**
4. **Record停止**
5. **LCP (Largest Contentful Paint)を確認**:
   - 🟢 Good: < 2.5秒
   - 🟡 Needs Improvement: 2.5-4秒
   - 🔴 Poor: > 4秒

### 3. Lighthouseレポート

1. **DevTools → Lighthouseタブ**
2. **Desktop/Mobileを選択**
3. **Analyze page load**
4. **スコア確認**:
   - Performance: 90+を目標
   - Accessibility: 90+を目標
   - Best Practices: 90+を目標

---

## ✅ 実装した最適化

### 1. プロフィールキャッシング（API呼び出し削減）

**Before**:
```
/api/workers/me - AuthContext
/api/workers/me - useProfile (Dashboard)
/api/workers/me - useProfile (Navbar)
= 合計 3回
```

**After**:
```
/api/workers/me - AuthContext (キャッシュ)
Dashboard/Navbarは AuthContext から取得
= 合計 1回 (66%削減)
```

### 2. バッチAPI（N+1問題解決）

**Before**:
```
タスクが10個ある場合:
/api/tasks/1/applications
/api/tasks/2/applications
...
/api/tasks/10/applications
= 合計 10リクエスト
```

**After**:
```
/api/tasks/batch-applications?taskIds=1,2,3,...,10
= 合計 1リクエスト (90%削減)
```

### 3. 2段階ローディング

**Phase 1 (即座に表示)**:
- タスク一覧
- 統計情報
- アプリケーション一覧

**Phase 2 (バックグラウンド)**:
- タスクごとの応募情報（バッチ取得）

### 4. エラーハンドリング強化

- ✅ ErrorBoundary追加（アプリ全体のクラッシュ防止）
- ✅ バッチAPIエラーの分離（コア機能は維持）
- ✅ useCallback依存配列の修正（無限ループ防止）

---

## 📈 期待されるパフォーマンス改善

### API呼び出し削減

| 項目 | Before | After | 改善率 |
|------|--------|-------|--------|
| プロフィール取得 | 3回 | 1回 | **66%削減** |
| タスク応募情報 | N回 | 1回 | **90%削減** (N=10の場合) |
| 合計リクエスト | 13回 | 4回 | **69%削減** (N=10の場合) |

### ページ読み込み時間

- **初期表示**: 500ms以内（統計とタスク一覧）
- **完全読み込み**: 1-2秒（応募情報含む）
- **LCP**: < 2.5秒（Good）

---

## 🐛 デバッグ方法

### エラーが発生した場合

1. **Console確認**: `F12` → Consoleタブ
2. **Networkエラー確認**: 
   - 赤いリクエストをクリック
   - Previewタブでエラーメッセージ確認
3. **ErrorBoundary表示**: 詳細エラー情報を展開

### よくある問題

**問題**: "Failed to load dashboard data"
- **原因**: APIエンドポイントの接続エラー
- **解決**: バックエンドが起動しているか確認

**問題**: "The same error occurred..."
- **原因**: Reactコンポーネントでエラー
- **解決**: ErrorBoundaryが詳細を表示

**問題**: ダッシュボードが空
- **原因**: タスク/応募が存在しない、またはフィルタリングエラー
- **解決**: Consoleでエラー確認

---

## 🎯 次のステップ

### さらなる最適化（Optional）

1. **画像最適化**: タスク画像のLazy Loading
2. **仮想スクロール**: タスク数が100+の場合
3. **Service Worker**: オフライン対応
4. **CDN**: 静的アセットの配信最適化

### 監視設定（Production）

1. **Sentry**: エラートラッキング
2. **Google Analytics**: ページ読み込み時間
3. **Vercel Analytics**: Core Web Vitals

---

## 📝 測定結果記録テンプレート

```markdown
## パフォーマンス測定結果 (YYYY-MM-DD)

### ネットワークリクエスト
- `/api/workers/me`: X回
- `/api/tasks`: X回
- `/api/applications`: X回
- `/api/tasks/batch-applications`: X回
- 合計リクエスト: X回

### タイムライン
- 初期表示: Xms
- 完全読み込み: Xms
- LCP: Xms

### Lighthouse
- Performance: XX/100
- Accessibility: XX/100
- Best Practices: XX/100

### 備考
- [特記事項]
```
