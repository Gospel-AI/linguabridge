# コンテンツモデレーション リスクレベル分類

**目的**: 禁止コンテンツカテゴリのリスクレベルと処理戦略を定義する
**バージョン**: 1.1
**最終更新**: 2025-11-01
**ステータス**: 本番環境対応

---

## 🎯 リスクレベル概要

TaskBridgeは**3段階のリスク分類システム**を採用し、異なる種類の禁止コンテンツの処理方法を決定します：

| リスクレベル | アクション | 対応時間 | 例 |
|------------|--------|---------|---|
| **CRITICAL** | 即座にブロック | 0ms | 薬物、武器、児童保護、テロリズム、詐欺、ハッキング |
| **HIGH** | レビュー待ち | 24時間 | 知的財産侵害、疑わしいパターン |
| **MEDIUM** | 警告付きで許可 | リアルタイム | 曖昧な指示、軽微なフラグ |

---

## 🔴 CRITICAL - 即座にブロック

**定義**: 個人、社会に直接的な害を及ぼす、または基本的な法律に違反する重大な違法行為

**アクション**: タスク投稿を即座に拒否（HTTP 403）
**ユーザーに表示される理由**: 「重大なポリシー違反が検出されました。このタスクにはプラットフォームで厳しく禁止されているコンテンツが含まれています。」

### カテゴリ

#### 1. 児童保護 (`child_safety`)
**リスクレベル**: CRITICAL
**理由**:
- 法律で義務付けられたゼロトレランスポリシー
- プラットフォームに対する重大な法的結果
- 被害者への不可逆的な害
- 正当なビジネス用途が存在しない

**キーワード**: child exploitation, underage, minors inappropriate, involving minors, csam, child abuse

---

#### 2. 違法薬物 (`illegal_drugs`)
**リスクレベル**: CRITICAL
**理由**:
- 世界中のほとんどの管轄区域で違法
- 公衆衛生と安全に対する脅威
- 薬物密売を促進することに対するプラットフォーム責任
- 組織犯罪を可能にする

**キーワード**: cocaine, heroin, methamphetamine, marijuana, weed, cannabis, sell marijuana, drug dealing, narcotics, illegal substances, mdma, ecstasy, sell drugs, buy drugs, drug trafficking

**注記**: 一部の管轄区域ではマリファナが合法化されていますが、国際的な範囲と規制の複雑さのため、保守的な姿勢を維持しています。

---

#### 3. 武器 (`weapons`)
**リスクレベル**: CRITICAL
**理由**:
- 直接的な物理的危害の可能性
- ほとんどの国で厳格な規制
- プラットフォームは法的コンプライアンスを検証できない
- 高い責任リスク

**キーワード**: illegal weapons, firearms, selling firearms, sell firearms, explosives, bomb making, ammunition, sell ammunition, gun sales, selling guns, ak-47, assault rifle, bomb instructions, explosive device

---

#### 4. 暴力・過激主義 (`violence_extremism`)
**リスクレベル**: CRITICAL
**理由**:
- 人命に対する直接的な脅威
- 暴力促進を防ぐ法的義務
- 大量死傷の可能性
- テロリズムの懸念

**キーワード**: terrorism, terrorist, violent extremism, kill someone, murder for hire, assassin, hurt a person, hurt someone, injure someone, harm someone, hate crime, ethnic cleansing

**v1.1で追加**: hurt a person, hurt someone, injure someone, harm someone（暴力請負の試みを明示的に検出）

---

#### 5. 詐欺スキーム (`fraud_schemes`)
**リスクレベル**: CRITICAL ⬆️ **(v1.1でHIGHからアップグレード)**
**理由**:
- **アップグレードの理由**: 被害者への直接的な金銭的被害、組織犯罪の促進、プラットフォームの法的責任
- マネーロンダリングはテロリズムと組織犯罪を促進
- ピラミッドスキームは広範囲の金銭的被害をもたらす
- プラットフォームはリアルタイムで正当性を検証できない

**キーワード**: money laundering, pyramid scheme, ponzi scheme, stolen credit cards, hacked accounts, fake reviews, counterfeit money, fake documents, forged passport, fake diploma, fake certificate, fraudulent

**影響**: レビュー待ちではなく、即座にブロックされるようになりました

---

#### 6. プライバシー侵害 (`privacy_violations`)
**リスクレベル**: CRITICAL ⬆️ **(v1.1でHIGHからアップグレード)**
**理由**:
- **アップグレードの理由**: 個人への直接的な害、ストーキングが暴力に発展する可能性、個人情報盗難の深刻性
- ハッキングは世界中でコンピュータ詐欺法に違反
- ストーキングはエスカレーションの可能性がある重大な犯罪
- プラットフォームにはユーザープライバシーを保護する義務がある

**キーワード**: hack account, hack into, steal data, spy on someone, stalking, illegal surveillance, personal information theft, steal password, phishing, identity theft

**影響**: レビュー待ちではなく、即座にブロックされるようになりました

---

## 🟡 HIGH - レビュー待ち

**定義**: 特定のコンテキストでは正当である可能性があるが、人間による検証が必要な疑わしいコンテンツ

**アクション**: `status='pending_review'`と`moderation_status='under_review'`でタスク作成
**ユーザーへの応答**: 「あなたのタスクはレビューのために提出されました。モデレーションチームが24時間以内にレビューします。」
**レビューSLA**: 24時間（営業日）

### カテゴリ

#### 7. 知的財産侵害 (`ip_violations`)
**リスクレベル**: HIGH
**理由**:
- **CRITICALではない理由**: コンテキストが重要 - 海賊版についての議論と実際の配布は異なる
- 法的グレーゾーンが存在（フェアユース、パロディ、教育目的）
- 一部の正当な使用例（セキュリティ研究、アーカイブソフトウェア）
- 人間によるレビューで意図を区別できる

**キーワード**: pirated software, cracked software, distribute pirated, sell pirated, torrent, counterfeit goods, sell counterfeit, fake designer, replica watches, fake products

**レビューガイドライン**:
- ✅ 承認: デジタル保存についての議論、セキュリティ研究、理論的な質問
- ❌ 拒否: 直接的な配布、販売、または海賊版の促進

---

### パターンベースの高リスク

#### 外部連絡要求
**パターン**: WhatsApp、Telegram、Signal、電話番号、Skype
**リスクレベル**: HIGH
**理由**: プラットフォーム迂回の試み

---

#### 直接支払い要求
**パターン**: PayPal、Venmo、Cash App、Zelle、Bitcoin、電信送金
**リスクレベル**: HIGH
**理由**: プラットフォームの支払い保護をバイパス

---

#### 個人情報要求
**パターン**: 「氏名/住所/電話番号を提供してください」、「詳細情報を送ってください」
**リスクレベル**: HIGH
**理由**: プライバシーの懸念、個人情報盗難の可能性

---

## ⚪ MEDIUM - 警告付きで許可

**定義**: ブロックするほどではないが、フラグを立てるべき軽微な懸念

**アクション**: タスクは正常に作成され、`moderation_warnings`フィールドに記録
**ユーザー通知**: なし（内部追跡のみ）

---

## 🔄 バージョン履歴

### v1.1 (2025-11-01) - リスクレベル再調整

**変更内容**:
1. **fraud_schemes**: HIGH → CRITICAL
   - **理由**: 直接的な金銭的被害、組織犯罪促進、法的責任
   - **影響**: マネーロンダリング、ピラミッドスキームが即座にブロックされるようになりました

2. **privacy_violations**: HIGH → CRITICAL
   - **理由**: 個人への直接的な害、ストーキングのエスカレーションリスク、個人情報盗難の深刻性
   - **影響**: ハッキング、ストーキングの試みが即座にブロックされるようになりました

3. **violence_extremism**: キーワード追加
   - **追加**: "hurt a person", "hurt someone", "injure someone", "harm someone"
   - **理由**: 暴力請負の試みを明示的に検出

4. **illegal_drugs**: キーワード拡張
   - **追加**: "marijuana", "weed", "cannabis", "sell marijuana", "buy marijuana"
   - **理由**: 地域的な合法化にもかかわらず、一般的な薬物用語をカバー

5. **weapons**: キーワード拡張
   - **追加**: "selling firearms", "sell firearms", "sell ammunition"
   - **理由**: 販売の試みをより明示的に検出

6. **child_safety**: キーワード拡張
   - **追加**: "involving minors", "minors in"
   - **理由**: より広範なパターンマッチング

7. **ip_violations**: キーワード拡張
   - **追加**: "distribute pirated", "sell pirated", "sell counterfeit", "fake products"
   - **理由**: 配布と販売のバリエーションをカバー

**テスト結果**: 27/27テストが合格（100%成功率）

---

### v1.0 (2025-10-31) - 初期実装

**初期分類**:
- CRITICAL: child_safety, illegal_drugs, violence_extremism, weapons
- HIGH: fraud_schemes, privacy_violations, ip_violations
- MEDIUM: 曖昧な指示、過度の緊急性

---

## 🎯 実装リファレンス

### コードの場所
`/backend/src/middleware/contentModeration.ts`

```typescript
private getRiskLevel(category: string): string {
  // CRITICAL: 即座にブロック - 重大な違法行為
  const criticalCategories = [
    'child_safety',
    'illegal_drugs',
    'violence_extremism',
    'weapons',
    'fraud_schemes',        // マネーロンダリング、ピラミッドスキーム (v1.1: HIGH → CRITICAL)
    'privacy_violations'    // ハッキング、ストーキング (v1.1: HIGH → CRITICAL)
  ];

  // HIGH: レビュー待ち - 疑わしいが正当である可能性
  const highCategories = ['ip_violations'];

  if (criticalCategories.includes(category)) return 'critical';
  if (highCategories.includes(category)) return 'high';
  return 'medium';
}
```

### アクションフロー

```
┌─────────────────┐
│  タスク投稿     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ コンテンツモデレーション  │
│   - キーワードマッチ    │
│   - パターン検出       │
└────────┬────────────┘
         │
         ├─── CRITICAL ──► ブロック (403) + エラーメッセージ
         │
         ├─── HIGH ────► pending_reviewで作成 + 通知
         │
         └─── MEDIUM/CLEAN ──► publishedで作成 + オプションの警告
```

---

## 📊 モニタリング & メトリクス

### 主要メトリクス

1. **ブロック率**: リスクレベル別のブロックされたタスクの割合
2. **誤検知率**: 誤ってフラグされた正当なタスク（目標: <5%）
3. **見逃し率**: 通過した禁止タスク（目標: <1%）
4. **レビューキューサイズ**: 人間によるレビューを待機しているタスク
5. **レビューSLAコンプライアンス**: 24時間以内にレビューされた割合

### アラート閾値

- ⚠️ **警告**: ブロック率 >20%（誤検知の可能性）
- 🚨 **クリティカル**: CRITICALカテゴリのタスクが作成された（ブロックされるべき）
- 📊 **レビュー**: HIGHリスクキュー >50件保留

---

## 🔐 法律 & コンプライアンス

### 管轄区域の考慮事項

- **米国**: CSAM法（18 U.S.C. § 2258A）、愛国者法（マネーロンダリング）
- **EU**: GDPR（プライバシー）、デジタルサービス法（コンテンツモデレーション）
- **日本**: 児童買春、児童ポルノに係る行為等の規制及び処罰並びに児童の保護等に関する法律
- **国際**: FATF勧告（金融犯罪）

### プラットフォームの責任

1. **注意義務**: 違法行為を防ぐための合理的な措置
2. **誠実**: 報告された違反に迅速に対処
3. **透明性**: ユーザーに明確なポリシーを伝達
4. **記録保持**: 法的照会のためのログ維持

---

## 📞 連絡先

リスクレベル分類に関する質問:
- **技術**: MODERATION_IMPLEMENTATION.mdを参照
- **法律**: LEGAL_COMPLIANCE.jp.mdを参照
- **ビジネス**: プラットフォーム管理者に連絡
