import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ModerationResult {
  allowed: boolean;
  action: 'ALLOW' | 'BLOCK' | 'HOLD_FOR_REVIEW' | 'WARN';
  flags: string[];
  reason?: string;
  confidence: number;
}

export class ContentModerationService {
  private prohibitedKeywords: Map<string, string[]> = new Map();

  constructor() {
    this.initializeKeywords();
  }

  /**
   * Main moderation function for task submissions
   */
  async moderateTaskSubmission(taskData: any): Promise<ModerationResult> {
    const flags: string[] = [];

    const content = `${taskData.title || ''} ${taskData.description || ''}`.toLowerCase();

    // 1. Keyword Detection
    const keywordFlags = this.detectProhibitedKeywords(content);
    flags.push(...keywordFlags);

    // 2. Pattern Detection
    const patternFlags = this.detectSuspiciousPatterns(taskData, content);
    flags.push(...patternFlags);

    // 3. Determine Action based on flags
    if (flags.some(f => f.startsWith('critical:'))) {
      return {
        allowed: false,
        action: 'BLOCK',
        flags,
        reason: 'Critical policy violation detected. This task contains content that is strictly prohibited on our platform.',
        confidence: 0.95
      };
    }

    if (flags.some(f => f.startsWith('high:'))) {
      return {
        allowed: false,
        action: 'HOLD_FOR_REVIEW',
        flags,
        reason: 'Suspicious content detected. This task will be reviewed by our moderation team before being published.',
        confidence: 0.80
      };
    }

    if (flags.some(f => f.startsWith('medium:'))) {
      return {
        allowed: true,
        action: 'WARN',
        flags,
        reason: 'Minor issues detected. Please ensure your task complies with our content policy.',
        confidence: 0.60
      };
    }

    return {
      allowed: true,
      action: 'ALLOW',
      flags: [],
      confidence: 1.0
    };
  }

  /**
   * Detect prohibited keywords in content
   */
  private detectProhibitedKeywords(content: string): string[] {
    const flags: string[] = [];

    for (const [category, keywords] of this.prohibitedKeywords.entries()) {
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          const riskLevel = this.getRiskLevel(category);
          flags.push(`${riskLevel}:prohibited_keyword:${category}:${keyword}`);
        }
      }
    }

    return flags;
  }

  /**
   * Detect suspicious patterns in task data
   */
  private detectSuspiciousPatterns(taskData: any, content: string): string[] {
    const flags: string[] = [];

    // Pattern 1: Unrealistic compensation
    if (taskData.budget > 500 && taskData.estimated_time < 30) {
      flags.push('high:unrealistic_compensation');
    }

    // Pattern 2: External contact attempt
    const contactPatterns = /whatsapp|telegram|signal|contact me at|email me directly|call me at|phone number|skype/i;
    if (contactPatterns.test(content)) {
      flags.push('high:external_contact_request');
    }

    // Pattern 3: Financial information request (CRITICAL)
    const financialPatterns = /bank account|credit card|ssn|social security number|passport number|driver license number|routing number/i;
    if (financialPatterns.test(content)) {
      flags.push('critical:financial_info_request');
    }

    // Pattern 4: Direct payment mention
    const paymentPatterns = /paypal|venmo|cash app|zelle|bitcoin wallet|crypto address|direct payment|wire transfer|western union/i;
    if (paymentPatterns.test(content)) {
      flags.push('high:direct_payment_request');
    }

    // Pattern 5: Platform circumvention
    const circumventionPatterns = /bypass platform|off-platform|avoid fees|no commission|direct hire|permanent hire/i;
    if (circumventionPatterns.test(content)) {
      flags.push('high:platform_circumvention');
    }

    // Pattern 6: Vague or suspicious instructions
    if (taskData.description && taskData.description.length < 50) {
      flags.push('medium:vague_instructions');
    }

    // Pattern 7: Personal information request
    const personalInfoPatterns = /provide your.*(?:full name|address|phone number|email address)|send me your.*(?:details|information|contact)/i;
    if (personalInfoPatterns.test(content)) {
      flags.push('high:personal_info_request');
    }

    // Pattern 8: Excessive urgency (common in scams)
    const urgencyPatterns = /urgent|asap|immediately|right now|today only|limited time/i;
    const urgencyCount = (content.match(urgencyPatterns) || []).length;
    if (urgencyCount >= 3) {
      flags.push('medium:excessive_urgency');
    }

    return flags;
  }

  /**
   * Determine risk level for a category
   */
  private getRiskLevel(category: string): string {
    // CRITICAL: Immediate block - severe illegal activities
    const criticalCategories = [
      'child_safety',
      'illegal_drugs',
      'violence_extremism',
      'weapons',
      'fraud_schemes',        // Money laundering, pyramid schemes
      'privacy_violations'    // Hacking, stalking
    ];

    // HIGH: Hold for review - suspicious but may be legitimate
    const highCategories = ['ip_violations'];

    if (criticalCategories.includes(category)) return 'critical';
    if (highCategories.includes(category)) return 'high';
    return 'medium';
  }

  /**
   * Initialize prohibited keywords database
   */
  private initializeKeywords(): void {
    this.prohibitedKeywords = new Map([
      // Category 1: Illegal Drugs
      ['illegal_drugs', [
        'cocaine', 'heroin', 'methamphetamine', 'meth', 'fentanyl',
        'marijuana', 'weed', 'cannabis', 'sell marijuana', 'buy marijuana',
        'drug dealing', 'narcotics', 'illegal substances', 'mdma', 'ecstasy',
        'sell drugs', 'buy drugs', 'drug trafficking'
      ]],

      // Category 2: Weapons
      ['weapons', [
        'illegal weapons', 'firearms', 'selling firearms', 'sell firearms',
        'explosives', 'bomb making', 'ammunition', 'sell ammunition',
        'gun sales', 'selling guns', 'ak-47', 'assault rifle',
        'bomb instructions', 'explosive device'
      ]],

      // Category 3: Fraud & Financial Crimes
      ['fraud_schemes', [
        'money laundering', 'pyramid scheme', 'ponzi scheme',
        'stolen credit cards', 'hacked accounts', 'fake reviews',
        'counterfeit money', 'fake documents', 'forged passport',
        'fake diploma', 'fake certificate', 'fraudulent'
      ]],

      // Category 4: Privacy Violations
      ['privacy_violations', [
        'hack account', 'hack into', 'steal data', 'spy on someone',
        'stalking', 'illegal surveillance', 'personal information theft',
        'steal password', 'phishing', 'identity theft'
      ]],

      // Category 5: Child Safety (CRITICAL)
      ['child_safety', [
        'child exploitation', 'underage', 'minors inappropriate',
        'involving minors', 'minors in', 'csam', 'child abuse'
      ]],

      // Category 6: Violence & Extremism
      ['violence_extremism', [
        'terrorism', 'terrorist', 'violent extremism',
        'kill someone', 'murder for hire', 'assassin', 'hurt a person',
        'hurt someone', 'injure someone', 'harm someone',
        'hate crime', 'ethnic cleansing'
      ]],

      // Category 7: Intellectual Property Violations
      ['ip_violations', [
        'pirated software', 'cracked software', 'distribute pirated',
        'sell pirated', 'torrent', 'counterfeit goods', 'sell counterfeit',
        'fake designer', 'replica watches', 'fake products'
      ]]
    ]);
  }

  /**
   * Log moderation action to database
   */
  async logModerationAction(
    taskId: string,
    result: ModerationResult,
    userId: string
  ): Promise<void> {
    try {
      if (result.action === 'HOLD_FOR_REVIEW' || result.action === 'BLOCK') {
        await supabase.from('moderation_queue').insert({
          task_id: taskId,
          flags: result.flags,
          ai_confidence: result.confidence,
          status: result.action === 'BLOCK' ? 'rejected' : 'pending'
        });
      }

      // Log all moderation attempts
      await supabase.from('moderation_logs').insert({
        task_id: taskId,
        user_id: userId,
        action: result.action,
        flags: result.flags,
        confidence: result.confidence,
        reason: result.reason
      });
    } catch (error) {
      console.error('Failed to log moderation action:', error);
      // Don't throw - logging failure shouldn't block the request
    }
  }
}

/**
 * Express middleware for content moderation
 */
export async function moderateContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const moderationService = new ContentModerationService();
    const result = await moderationService.moderateTaskSubmission(req.body);

    // BLOCK - Immediate rejection
    if (result.action === 'BLOCK') {
      return res.status(403).json({
        error: 'Task submission blocked',
        reason: result.reason,
        message: 'This task violates our content policy and cannot be posted. If you believe this is an error, please contact support.'
      });
    }

    // HOLD_FOR_REVIEW - Add to review queue
    if (result.action === 'HOLD_FOR_REVIEW') {
      req.body.status = 'pending_review';
      req.body.moderation_status = 'under_review';
      req.body.moderation_flags = result.flags;

      // Attach message for response
      (req as any).moderationMessage =
        'Your task has been submitted for review. Our moderation team will review it within 24 hours.';
    }

    // WARN - Allow but flag
    if (result.action === 'WARN') {
      req.body.moderation_warnings = result.flags;
      (req as any).moderationWarning = result.reason;
    }

    // Attach moderation result to request for logging
    (req as any).moderationResult = result;

    next();
  } catch (error) {
    console.error('Content moderation error:', error);
    // Fail-safe: on error, hold for manual review
    req.body.status = 'pending_review';
    req.body.moderation_status = 'error_requires_review';
    next();
  }
}

/**
 * Middleware to log moderation results after task creation
 */
export async function logModeration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const moderationResult = (req as any).moderationResult;
  const taskId = (res.locals as any).taskId;
  const userId = (req as any).user?.id;

  if (moderationResult && taskId && userId) {
    const moderationService = new ContentModerationService();
    await moderationService.logModerationAction(taskId, moderationResult, userId);
  }

  next();
}
