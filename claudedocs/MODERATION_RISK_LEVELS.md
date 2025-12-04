# Content Moderation Risk Level Classification

**Purpose**: Define risk levels for prohibited content categories and their handling strategies
**Version**: 1.1
**Last Updated**: 2025-11-01
**Status**: Production

---

## 🎯 Risk Level Overview

TaskBridge employs a **3-tier risk classification system** to determine how different types of prohibited content should be handled:

| Risk Level | Action | Response Time | Examples |
|------------|--------|---------------|----------|
| **CRITICAL** | Immediate Block | 0ms | Drugs, weapons, child safety, terrorism, fraud, hacking |
| **HIGH** | Hold for Review | 24 hours | IP violations, suspicious patterns |
| **MEDIUM** | Allow with Warning | Real-time | Vague instructions, minor flags |

---

## 🔴 CRITICAL - Immediate Block

**Definition**: Severe illegal activities that pose direct harm to individuals, society, or violate fundamental laws

**Action**: Task submission rejected immediately (HTTP 403)
**Reason Shown to User**: "Critical policy violation detected. This task contains content that is strictly prohibited on our platform."

### Categories

#### 1. Child Safety (`child_safety`)
**Risk Level**: CRITICAL
**Rationale**:
- Zero-tolerance policy mandated by law
- Severe legal consequences (CSAM laws, child protection regulations)
- Irreversible harm to victims
- No legitimate business use cases

**Keywords**: child exploitation, underage, minors inappropriate, involving minors, csam, child abuse

**Action**: Immediate block + automatic report to authorities (if required by jurisdiction)

---

#### 2. Illegal Drugs (`illegal_drugs`)
**Risk Level**: CRITICAL
**Rationale**:
- Illegal in most jurisdictions worldwide
- Public health and safety threat
- Platform liability for facilitating drug trafficking
- Enables organized crime

**Keywords**: cocaine, heroin, methamphetamine, marijuana, weed, cannabis, sell marijuana, drug dealing, narcotics, illegal substances, mdma, ecstasy, sell drugs, buy drugs, drug trafficking

**Note**: While some jurisdictions have legalized marijuana, we maintain a conservative stance due to international scope and regulatory complexity.

---

#### 3. Weapons (`weapons`)
**Risk Level**: CRITICAL
**Rationale**:
- Direct physical harm potential
- Strict regulations in most countries
- Platform cannot verify legal compliance (licenses, background checks)
- High liability risk

**Keywords**: illegal weapons, firearms, selling firearms, sell firearms, explosives, bomb making, ammunition, sell ammunition, gun sales, selling guns, ak-47, assault rifle, bomb instructions, explosive device

---

#### 4. Violence & Extremism (`violence_extremism`)
**Risk Level**: CRITICAL
**Rationale**:
- Direct threat to human life
- Legal obligations to prevent violence facilitation
- Potential for mass casualties
- Terrorism concerns

**Keywords**: terrorism, terrorist, violent extremism, kill someone, murder for hire, assassin, hurt a person, hurt someone, injure someone, harm someone, hate crime, ethnic cleansing

**Added in v1.1**: hurt a person, hurt someone, injure someone, harm someone (to catch violence-for-hire attempts)

---

#### 5. Fraud Schemes (`fraud_schemes`)
**Risk Level**: CRITICAL ⬆️ **(Upgraded from HIGH in v1.1)**
**Rationale**:
- **Why Upgraded**: Direct financial harm to victims, enables organized crime, legal liability for platform
- Money laundering facilitates terrorism and organized crime
- Pyramid schemes cause widespread financial devastation
- Platform cannot verify legitimacy in real-time

**Keywords**: money laundering, pyramid scheme, ponzi scheme, stolen credit cards, hacked accounts, fake reviews, counterfeit money, fake documents, forged passport, fake diploma, fake certificate, fraudulent

**Impact**: Now blocked immediately instead of held for review

---

#### 6. Privacy Violations (`privacy_violations`)
**Risk Level**: CRITICAL ⬆️ **(Upgraded from HIGH in v1.1)**
**Rationale**:
- **Why Upgraded**: Direct harm to individuals, stalking can lead to violence, identity theft causes severe financial/emotional damage
- Hacking violates computer fraud laws globally
- Stalking is a serious crime with potential for escalation
- Platform has duty to protect user privacy

**Keywords**: hack account, hack into, steal data, spy on someone, stalking, illegal surveillance, personal information theft, steal password, phishing, identity theft

**Impact**: Now blocked immediately instead of held for review

---

## 🟡 HIGH - Hold for Review

**Definition**: Suspicious content that may be legitimate in certain contexts but requires human verification

**Action**: Task created with `status='pending_review'` and `moderation_status='under_review'`
**Response to User**: "Your task has been submitted for review. Our moderation team will review it within 24 hours."
**Review SLA**: 24 hours (business days)

### Categories

#### 7. Intellectual Property Violations (`ip_violations`)
**Risk Level**: HIGH
**Rationale**:
- **Why NOT Critical**: Context matters - discussions about piracy vs. actual distribution differ
- Legal gray areas exist (fair use, parody, educational purposes)
- Some legitimate use cases (security research, archived software)
- Human review can distinguish intent

**Keywords**: pirated software, cracked software, distribute pirated, sell pirated, torrent, counterfeit goods, sell counterfeit, fake designer, replica watches, fake products

**Review Guidelines**:
- ✅ APPROVE: Discussions about digital preservation, security research, theoretical questions
- ❌ REJECT: Direct distribution, sales, or facilitating piracy

---

### Pattern-Based High Risk

#### External Contact Requests
**Pattern**: WhatsApp, Telegram, Signal, phone numbers, Skype
**Risk Level**: HIGH
**Rationale**: Indicates platform circumvention attempt

**Review Guidelines**:
- Check if legitimate business need (e.g., "WhatsApp customer support testing")
- Verify task aligns with platform categories
- Confirm compensation isn't suspiciously high

---

#### Direct Payment Requests
**Pattern**: PayPal, Venmo, Cash App, Zelle, Bitcoin, wire transfer
**Risk Level**: HIGH
**Rationale**: Bypasses platform payment protection

**Review Guidelines**:
- Legitimate if discussing payment methods for testing/research
- Reject if attempting to arrange off-platform payment

---

#### Personal Information Requests
**Pattern**: "provide your full name/address/phone number", "send me your details"
**Risk Level**: HIGH
**Rationale**: Privacy concern, potential for identity theft

**Review Guidelines**:
- Legitimate for address verification tasks (with clear purpose)
- Reject if information requested is excessive for task

---

#### Multiple Suspicious Patterns
**Risk Level**: HIGH
**Rationale**: Combination of red flags increases likelihood of scam

**Example**: "URGENT! Contact me on WhatsApp for cash payment!"

---

## ⚪ MEDIUM - Allow with Warning

**Definition**: Minor concerns that don't warrant blocking but should be flagged

**Action**: Task created normally, `moderation_warnings` field populated
**User Notification**: None (internal tracking only)

### Patterns

#### Vague Instructions
**Pattern**: Description < 50 characters
**Risk Level**: MEDIUM
**Rationale**: May indicate incomplete task or scam, but also legitimate quick tasks

---

#### Excessive Urgency
**Pattern**: 3+ instances of "urgent", "asap", "immediately", "right now"
**Risk Level**: MEDIUM
**Rationale**: Common scam tactic, but also legitimate urgent tasks exist

---

## 📊 Risk Level Decision Matrix

### Upgrading Criteria (MEDIUM → HIGH → CRITICAL)

A category should be upgraded to CRITICAL if:
1. ✅ Direct physical harm potential
2. ✅ Severe legal consequences for platform
3. ✅ No legitimate business use cases
4. ✅ Irreversible harm to victims
5. ✅ Law enforcement reporting may be required

A category should be HIGH if:
1. ✅ Context-dependent legitimacy
2. ✅ Human review can distinguish intent
3. ✅ Gray areas exist legally or ethically
4. ✅ False positives would harm platform usability

### Downgrading Criteria

A category should be downgraded if:
1. ✅ High false positive rate observed
2. ✅ Legitimate use cases are common
3. ✅ Platform benefits from allowing with oversight
4. ✅ Risk is manageable with review process

---

## 🔄 Version History

### v1.1 (2025-11-01) - Risk Level Recalibration

**Changes**:
1. **fraud_schemes**: HIGH → CRITICAL
   - **Reason**: Direct financial harm, organized crime facilitation, legal liability
   - **Impact**: Money laundering, pyramid schemes now blocked immediately

2. **privacy_violations**: HIGH → CRITICAL
   - **Reason**: Direct harm to individuals, stalking escalation risk, identity theft severity
   - **Impact**: Hacking, stalking attempts now blocked immediately

3. **violence_extremism**: Added keywords
   - **Added**: "hurt a person", "hurt someone", "injure someone", "harm someone"
   - **Reason**: Catch violence-for-hire attempts explicitly

4. **illegal_drugs**: Expanded keywords
   - **Added**: "marijuana", "weed", "cannabis", "sell marijuana", "buy marijuana"
   - **Reason**: Cover common drug terms despite regional legalization

5. **weapons**: Expanded keywords
   - **Added**: "selling firearms", "sell firearms", "sell ammunition"
   - **Reason**: Catch sales attempts more explicitly

6. **child_safety**: Expanded keywords
   - **Added**: "involving minors", "minors in"
   - **Reason**: Broader pattern matching

7. **ip_violations**: Expanded keywords
   - **Added**: "distribute pirated", "sell pirated", "sell counterfeit", "fake products"
   - **Reason**: Cover distribution and sales variations

**Testing Results**: 27/27 tests passed (100% success rate)

---

### v1.0 (2025-10-31) - Initial Implementation

**Initial Classification**:
- CRITICAL: child_safety, illegal_drugs, violence_extremism, weapons
- HIGH: fraud_schemes, privacy_violations, ip_violations
- MEDIUM: Vague instructions, excessive urgency

---

## 🎯 Implementation Reference

### Code Location
`/backend/src/middleware/contentModeration.ts`

```typescript
private getRiskLevel(category: string): string {
  // CRITICAL: Immediate block - severe illegal activities
  const criticalCategories = [
    'child_safety',
    'illegal_drugs',
    'violence_extremism',
    'weapons',
    'fraud_schemes',        // Money laundering, pyramid schemes (v1.1: HIGH → CRITICAL)
    'privacy_violations'    // Hacking, stalking (v1.1: HIGH → CRITICAL)
  ];

  // HIGH: Hold for review - suspicious but may be legitimate
  const highCategories = ['ip_violations'];

  if (criticalCategories.includes(category)) return 'critical';
  if (highCategories.includes(category)) return 'high';
  return 'medium';
}
```

### Action Flow

```
┌─────────────────┐
│  Task Submitted │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Content Moderation  │
│   - Keyword Match   │
│   - Pattern Detect  │
└────────┬────────────┘
         │
         ├─── CRITICAL ──► Block (403) + Error Message
         │
         ├─── HIGH ────► Create with pending_review + Notification
         │
         └─── MEDIUM/CLEAN ──► Create with published + Optional Warning
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Track

1. **Block Rate**: % of tasks blocked by risk level
2. **False Positive Rate**: Legitimate tasks incorrectly flagged (target: <5%)
3. **False Negative Rate**: Prohibited tasks that passed (target: <1%)
4. **Review Queue Size**: Tasks awaiting human review
5. **Review SLA Compliance**: % reviewed within 24 hours

### Alert Thresholds

- ⚠️ **Warning**: Block rate >20% (possible false positives)
- 🚨 **Critical**: Any CRITICAL category task created (should be blocked)
- 📊 **Review**: HIGH risk queue >50 pending tasks

---

## 🔐 Legal & Compliance

### Jurisdiction Considerations

- **US**: CSAM laws (18 U.S.C. § 2258A), PATRIOT Act (money laundering)
- **EU**: GDPR (privacy), Digital Services Act (content moderation)
- **Japan**: Act on Punishment of Activities Relating to Child Prostitution and Child Pornography
- **International**: FATF recommendations (financial crimes)

### Platform Responsibilities

1. **Duty of Care**: Reasonable steps to prevent illegal activities
2. **Good Faith**: Act promptly on reported violations
3. **Transparency**: Clear policies communicated to users
4. **Record Keeping**: Maintain logs for legal inquiries

---

## 🚀 Future Enhancements

### v1.2 (Planned)
1. **Machine Learning**: Train model on moderation decisions for improved accuracy
2. **Contextual Analysis**: NLP to understand intent beyond keywords
3. **Risk Scoring**: Numerical scores (0-100) instead of binary classification
4. **User Reputation**: Adjust thresholds based on user trust score

### v2.0 (Future)
1. **AI Integration**: OpenAI Moderation API for semantic understanding
2. **Multilingual**: Support for non-English content moderation
3. **Image/Video**: Detect prohibited content in attachments
4. **Real-time Appeals**: User can request review with additional context

---

## 📞 Contact

For questions about risk level classification:
- **Technical**: See MODERATION_IMPLEMENTATION.md
- **Legal**: See LEGAL_COMPLIANCE.md
- **Business**: Contact platform administrators
