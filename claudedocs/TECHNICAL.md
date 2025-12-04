# TaskBridge - Technical Specifications

**Version**: v2.0
**Last Updated**: 2025-10-31
**Target Audience**: Developers, Technical Architects

> **Language Versions**:
> - 🇬🇧 English: [TECHNICAL.md](./TECHNICAL.md)
> - 🇯🇵 Japanese: [TECHNICAL.jp.md](./TECHNICAL.jp.md)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack Details](#technology-stack-details)
3. [Focus Domain Implementations](#focus-domain-implementations)
4. [Automated Worker Certification](#automated-worker-certification)
5. [Tier Management Automation](#tier-management-automation)
6. [Quality Control Automation](#quality-control-automation)
7. [Database Design](#database-design)
8. [API Design](#api-design)
9. [Authentication & Authorization](#authentication--authorization)
10. [Stripe Connect Integration](#stripe-connect-integration)
11. [Security Design](#security-design)
12. [Deployment Strategy](#deployment-strategy)
13. [Development Workflow](#development-workflow)
14. [Performance Optimization](#performance-optimization)

---

## System Architecture

### Overall Architecture Diagram

```
┌─────────────────┐
│   User Browser  │
│  (React SPA)    │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│     Vercel      │ ← Frontend hosting
│  (React Build)  │
└────────┬────────┘
         │ API Calls
         ↓
┌─────────────────┐
│    Railway      │ ← Backend hosting
│ (Node.js/Express)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌─────────┐ ┌──────────┐
│ Supabase│ │  Stripe  │
│ (DB+Auth)│ │(Payment) │
│ +PostGIS│ │ Connect  │
└─────────┘ └──────────┘
         │
         ↓
┌─────────────────┐
│  Automation     │
│  - Supabase     │
│    Functions    │
│  - Cron Jobs    │
└─────────────────┘
```

### v2.0 Architecture Enhancements

#### **New Components**

1. **Focus Domain Processors**
   - Translation/Localization validation engine
   - AI verification and bias detection
   - GPS and photo quality verification

2. **Automated Certification System**
   - Video progress tracking
   - Auto-graded quiz engine
   - Instant certification issuance

3. **Tier Management Automation**
   - Supabase Functions for auto-promotion/demotion
   - Scheduled evaluation jobs
   - Automated notification system

4. **Quality Control Pipeline**
   - Real-time submission validation
   - GPS spoofing detection
   - Photo quality analysis
   - Bias detection algorithms

### Layer Architecture

#### **Presentation Layer (Frontend)**
- React 18 + TypeScript
- Tailwind CSS
- React Router (page routing)
- React Query (server state management)
- Zustand (client state management)

#### **Application Layer (Backend)**
- Node.js 20 + Express
- TypeScript
- RESTful API
- Webhook handling (Stripe)
- **NEW**: Image processing (Sharp)
- **NEW**: EXIF extraction
- **NEW**: GPS validation logic

#### **Data Layer**
- Supabase PostgreSQL (relational DB)
- **NEW**: PostGIS (geospatial extension)
- Supabase Auth (authentication)
- **NEW**: Supabase Functions (automation)
- Stripe Connect (payments & transfers)

---

## Technology Stack Details

### Frontend

#### **Core Technologies**
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "react-router-dom": "^6.20.0"
}
```

#### **UI/Styling**
```json
{
  "tailwindcss": "^3.4.0",
  "headlessui": "^1.7.0",
  "heroicons": "^2.1.0",
  "react-hot-toast": "^2.4.0"
}
```

#### **State Management & Data Fetching**
```json
{
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0"
}
```

#### **Form & Validation**
```json
{
  "react-hook-form": "^7.49.0",
  "zod": "^3.22.0"
}
```

#### **API Integrations**
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@stripe/stripe-js": "^2.4.0",
  "@stripe/react-stripe-js": "^2.4.0"
}
```

#### **NEW: Media & Geolocation (v2.0)**
```json
{
  "react-player": "^2.14.0",
  "exif-js": "^2.3.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1"
}
```

---

### Backend

#### **Core Technologies**
```json
{
  "node": "20.x",
  "express": "^4.18.0",
  "typescript": "^5.0.0"
}
```

#### **Stripe Integration**
```json
{
  "stripe": "^14.10.0"
}
```

#### **NEW: Image Processing & Geospatial (v2.0)**
```json
{
  "sharp": "^0.33.0",
  "exif-parser": "^0.1.12",
  "@turf/turf": "^6.5.0"
}
```

#### **Utilities**
```json
{
  "dotenv": "^16.3.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.0"
}
```

#### **Development**
```json
{
  "tsx": "^4.7.0",
  "nodemon": "^3.0.0",
  "eslint": "^8.56.0",
  "prettier": "^3.1.0"
}
```

---

## Focus Domain Implementations

### Domain 1: Translation/Localization Validation 🌍

#### **Frontend Components**

**Specialized Task Posting Form**:
```typescript
// frontend/src/components/tasks/TranslationTaskForm.tsx
interface TranslationTaskFormData {
  title: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
  documentType: 'marketing' | 'legal' | 'technical' | 'general';
  industry: string;
  wordCount: number;
  amount: number;
  deadline: string;
  evaluationCriteria: {
    accuracy: boolean;
    naturalness: boolean;
    culturalAppropriateness: boolean;
  };
  referenceFiles?: File[];
}

const TranslationTaskForm: React.FC = () => {
  const { register, handleSubmit } = useForm<TranslationTaskFormData>();

  const onSubmit = async (data: TranslationTaskFormData) => {
    const response = await api.post('/api/tasks/translation', data);
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Language pair selection */}
      <LanguagePairSelector />

      {/* Evaluation criteria checkboxes */}
      <EvaluationCriteriaSelector />

      {/* Reference file upload */}
      <FileUploader accept=".pdf,.docx" />
    </form>
  );
};
```

**Structured Evaluation Template**:
```typescript
// frontend/src/components/evaluations/TranslationEvaluationForm.tsx
interface TranslationEvaluation {
  taskId: string;
  accuracy: number; // 1-5
  naturalness: number; // 1-5
  culturalAppropriateness: number; // 1-5
  comments: string;
  issues?: string[];
  improvements?: string[];
}

const TranslationEvaluationForm: React.FC<{ taskId: string }> = ({ taskId }) => {
  const { register, handleSubmit } = useForm<TranslationEvaluation>();

  const onSubmit = async (data: TranslationEvaluation) => {
    await api.post('/api/evaluations/translation', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <RatingSlider label="Accuracy" name="accuracy" min={1} max={5} />
      <RatingSlider label="Naturalness" name="naturalness" min={1} max={5} />
      <RatingSlider label="Cultural Appropriateness" name="culturalAppropriateness" min={1} max={5} />
      <textarea placeholder="Comments..." {...register('comments')} />
    </form>
  );
};
```

#### **Backend Implementation**

**Auto-Matching Algorithm**:
```typescript
// backend/src/services/translationMatching.ts
interface LanguagePair {
  source: string;
  target: string;
  proficiency: 'native' | 'fluent' | 'intermediate';
}

export async function findMatchingWorkers(
  taskId: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<any[]> {
  const { data: workers, error } = await supabase
    .from('workers')
    .select('*')
    .contains('language_pairs', [
      { source: sourceLanguage, target: targetLanguage }
    ])
    .eq('certifications', ['translation'])
    .gte('average_rating', 4.0)
    .order('average_rating', { ascending: false })
    .limit(20);

  if (error) throw error;
  return workers || [];
}
```

---

### Domain 2: AI Verification & Improvement 🤖

#### **Frontend Components**

**AI Quality Check Form**:
```typescript
// frontend/src/components/tasks/AIVerificationTaskForm.tsx
interface AIVerificationTaskFormData {
  title: string;
  description: string;
  aiContentType: 'text' | 'image' | 'response';
  biasCheckRequired: boolean;
  hallucinationCheckRequired: boolean;
  culturalRegions: string[]; // ['north_america', 'asia', 'europe']
  sampleSize: number;
  amount: number;
  deadline: string;
  contentFiles: File[];
}

const AIVerificationTaskForm: React.FC = () => {
  const { register, handleSubmit, watch } = useForm<AIVerificationTaskFormData>();
  const aiContentType = watch('aiContentType');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* AI content type selection */}
      <select {...register('aiContentType')}>
        <option value="text">Text Generation</option>
        <option value="image">Image Generation</option>
        <option value="response">Chatbot Responses</option>
      </select>

      {/* Verification requirements */}
      <label>
        <input type="checkbox" {...register('biasCheckRequired')} />
        Bias Detection Required
      </label>

      <label>
        <input type="checkbox" {...register('hallucinationCheckRequired')} />
        Hallucination Detection Required
      </label>

      {/* Cultural region selection */}
      <MultiSelect
        options={['north_america', 'europe', 'asia', 'africa', 'south_america']}
        {...register('culturalRegions')}
      />
    </form>
  );
};
```

**AI Verification Result Form**:
```typescript
// frontend/src/components/evaluations/AIVerificationResultForm.tsx
interface AIVerificationResult {
  taskId: string;
  qualityScore: number; // 1-5
  biasDetected: boolean;
  biasDetails?: string;
  hallucinationDetected: boolean;
  hallucinationDetails?: string;
  culturalAppropriateness: Record<string, number>; // { "north_america": 4, "asia": 3 }
  improvementSuggestions: string;
}

const AIVerificationResultForm: React.FC = () => {
  const [biasDetected, setBiasDetected] = useState(false);
  const [hallucinationDetected, setHallucinationDetected] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <RatingSlider label="Overall Quality" name="qualityScore" />

      <label>
        <input
          type="checkbox"
          checked={biasDetected}
          onChange={(e) => setBiasDetected(e.target.checked)}
        />
        Bias Detected
      </label>

      {biasDetected && (
        <textarea
          placeholder="Describe the bias detected..."
          {...register('biasDetails')}
        />
      )}

      {/* Cultural appropriateness scores by region */}
      <CulturalScoreGrid regions={task.culturalRegions} />
    </form>
  );
};
```

#### **Backend Implementation**

```typescript
// backend/src/services/aiVerification.ts
export async function submitAIVerificationResult(
  taskId: string,
  workerId: string,
  result: AIVerificationResult
) {
  const { data, error } = await supabase
    .from('ai_verification_results')
    .insert({
      task_id: taskId,
      worker_id: workerId,
      quality_score: result.qualityScore,
      bias_detected: result.biasDetected,
      bias_details: result.biasDetails,
      hallucination_detected: result.hallucinationDetected,
      hallucination_details: result.hallucinationDetails,
      cultural_appropriateness: result.culturalAppropriateness,
      improvement_suggestions: result.improvementSuggestions,
    });

  if (error) throw error;
  return data;
}
```

---

### Domain 3: Physical Data Collection & Verification 📍

#### **Frontend Components**

**Location-Based Task Posting**:
```typescript
// frontend/src/components/tasks/PhysicalDataTaskForm.tsx
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

interface PhysicalDataTaskFormData {
  title: string;
  description: string;
  taskLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  radiusMeters: number; // Acceptable range
  photoRequired: boolean;
  minPhotoResolution: number;
  photoInstructions: string;
  amount: number;
  deadline: string;
}

const PhysicalDataTaskForm: React.FC = () => {
  const [location, setLocation] = useState({ lat: 0, lng: 0 });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Map for location selection */}
      <MapContainer center={[location.lat, location.lng]} zoom={13}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[location.lat, location.lng]} />
      </MapContainer>

      {/* Radius input */}
      <input
        type="number"
        placeholder="Acceptable radius (meters)"
        {...register('radiusMeters')}
      />

      {/* Photo requirements */}
      <label>
        <input type="checkbox" {...register('photoRequired')} />
        Photo Required
      </label>

      <select {...register('minPhotoResolution')}>
        <option value="720">720p (HD)</option>
        <option value="1080">1080p (Full HD)</option>
        <option value="2160">4K</option>
      </select>
    </form>
  );
};
```

**Photo Submission with GPS**:
```typescript
// frontend/src/components/submissions/PhysicalDataSubmissionForm.tsx
const PhysicalDataSubmissionForm: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [gpsLocation, setGpsLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    // Get GPS location
    navigator.geolocation.getCurrentPosition(
      (position) => setGpsLocation(position),
      (error) => console.error('GPS error:', error),
      { enableHighAccuracy: true }
    );
  }, []);

  const handlePhotoUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      // Extract EXIF data
      const exifData = await extractEXIF(file);

      // Validate photo quality
      const quality = await validatePhotoQuality(file);

      if (quality.resolution >= task.minPhotoResolution) {
        setPhotos((prev) => [...prev, file]);
      } else {
        toast.error(`Photo resolution too low: ${quality.resolution}p`);
      }
    }
  };

  const onSubmit = async () => {
    if (!gpsLocation) {
      toast.error('GPS location required');
      return;
    }

    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('latitude', gpsLocation.coords.latitude.toString());
    formData.append('longitude', gpsLocation.coords.longitude.toString());

    photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, photo);
    });

    await api.post('/api/submissions/physical-data', formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FileUploader
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
      />

      {gpsLocation && (
        <div>
          GPS: {gpsLocation.coords.latitude.toFixed(6)}, {gpsLocation.coords.longitude.toFixed(6)}
        </div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
};
```

#### **Backend Implementation**

**GPS Verification**:
```typescript
// backend/src/services/gpsVerification.ts
import * as turf from '@turf/turf';

export async function verifyGPSLocation(
  submissionLocation: { lat: number; lng: number },
  taskLocation: { lat: number; lng: number },
  radiusMeters: number
): Promise<{ verified: boolean; distance: number }> {
  const from = turf.point([submissionLocation.lng, submissionLocation.lat]);
  const to = turf.point([taskLocation.lng, taskLocation.lat]);

  const distance = turf.distance(from, to, { units: 'meters' });
  const verified = distance <= radiusMeters;

  return { verified, distance };
}

// Check for GPS spoofing (basic heuristics)
export async function detectGPSSpoofing(
  workerId: string,
  currentLocation: { lat: number; lng: number; timestamp: Date },
  previousLocation?: { lat: number; lng: number; timestamp: Date }
): Promise<boolean> {
  if (!previousLocation) return false;

  const timeDiff = (currentLocation.timestamp.getTime() - previousLocation.timestamp.getTime()) / 1000; // seconds
  const distance = turf.distance(
    turf.point([previousLocation.lng, previousLocation.lat]),
    turf.point([currentLocation.lng, currentLocation.lat]),
    { units: 'kilometers' }
  );

  // Check if movement speed is unrealistic (e.g., > 200 km/h)
  const speed = distance / (timeDiff / 3600); // km/h

  if (speed > 200) {
    console.warn(`Possible GPS spoofing: ${speed.toFixed(2)} km/h`);
    return true;
  }

  return false;
}
```

**Photo Quality Validation**:
```typescript
// backend/src/services/photoQuality.ts
import sharp from 'sharp';
import ExifParser from 'exif-parser';

export async function validatePhotoQuality(
  photoBuffer: Buffer,
  minResolution: number
): Promise<{
  valid: boolean;
  resolution: string;
  width: number;
  height: number;
  fileSize: number;
  exif?: any;
}> {
  // Get image metadata
  const metadata = await sharp(photoBuffer).metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const resolution = Math.min(width, height);

  // Extract EXIF data
  let exif;
  try {
    const parser = ExifParser.create(photoBuffer);
    exif = parser.parse();
  } catch (err) {
    console.warn('EXIF extraction failed:', err);
  }

  return {
    valid: resolution >= minResolution,
    resolution: `${width}x${height}`,
    width,
    height,
    fileSize: photoBuffer.length,
    exif,
  };
}

// Check photo clarity (optional, uses ML)
export async function checkPhotoClarity(photoBuffer: Buffer): Promise<number> {
  // Compute Laplacian variance (measure of sharpness)
  const image = sharp(photoBuffer).grayscale();
  const stats = await image.stats();

  // Higher variance = sharper image
  // This is a simplified approach; production would use ML
  const clarity = stats.channels[0].stdev;

  return Math.min(clarity / 50, 5); // Scale to 0-5
}
```

---

## Automated Worker Certification

### System Design

```
┌─────────────────────────────────────────────────────┐
│          Worker Application (Auto-Approved)          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│              Self-Paced Training                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │  Video (10m) │→ │ Exercises    │→ │  Quiz (5m) ││
│  │  Loom embed  │  │ (15m)        │  │  Auto-grade││
│  └──────────────┘  └──────────────┘  └────────────┘│
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│        Certification Test (Real Samples)             │
│          Auto-Graded | 70% Pass Rate                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│     Instant Certification & Task Access             │
└─────────────────────────────────────────────────────┘
```

### Frontend Implementation

**Training Module Viewer**:
```typescript
// frontend/src/components/training/TrainingModuleViewer.tsx
import ReactPlayer from 'react-player';

interface TrainingModule {
  id: string;
  domainType: string;
  videoUrl: string;
  videoDurationMinutes: number;
  exercises: Exercise[];
  quizQuestions: QuizQuestion[];
}

const TrainingModuleViewer: React.FC<{ domain: string }> = ({ domain }) => {
  const { data: module } = useQuery(['training', domain], () =>
    api.get(`/api/training/${domain}`)
  );

  const [videoCompleted, setVideoCompleted] = useState(false);
  const [exercisesCompleted, setExercisesCompleted] = useState(false);

  const handleVideoProgress = async (progress: { played: number }) => {
    if (progress.played >= 0.95 && !videoCompleted) {
      setVideoCompleted(true);
      await api.post('/api/training/video-progress', {
        domainType: domain,
        completed: true,
      });
    }
  };

  return (
    <div>
      {/* Video Section */}
      <section>
        <h2>Training Video</h2>
        <ReactPlayer
          url={module.videoUrl}
          controls
          onProgress={handleVideoProgress}
        />
      </section>

      {/* Interactive Exercises */}
      {videoCompleted && (
        <section>
          <h2>Interactive Exercises</h2>
          <ExerciseList
            exercises={module.exercises}
            onComplete={() => setExercisesCompleted(true)}
          />
        </section>
      )}

      {/* Quiz */}
      {exercisesCompleted && (
        <section>
          <h2>Certification Quiz</h2>
          <Quiz questions={module.quizQuestions} passingScore={70} />
        </section>
      )}
    </div>
  );
};
```

**Auto-Graded Quiz Engine**:
```typescript
// frontend/src/components/training/Quiz.tsx
interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
}

const Quiz: React.FC<{ questions: QuizQuestion[]; passingScore: number }> = ({
  questions,
  passingScore,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const handleSubmit = async () => {
    const response = await api.post('/api/training/submit-quiz', {
      domainType: 'translation', // or ai_verification, physical
      answers,
    });

    setResult(response.data);

    if (response.data.passed) {
      toast.success('Congratulations! You are now certified.');
    } else {
      toast.error(`You scored ${response.data.score}%. Try again in 24 hours.`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.question}</p>

          {q.type === 'multiple_choice' && (
            <div>
              {q.options?.map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={q.id}
                    value={option}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          )}

          {q.type === 'true_false' && (
            <div>
              <label>
                <input
                  type="radio"
                  name={q.id}
                  value="true"
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                />
                True
              </label>
              <label>
                <input
                  type="radio"
                  name={q.id}
                  value="false"
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                />
                False
              </label>
            </div>
          )}
        </div>
      ))}

      <button type="submit">Submit Quiz</button>
    </form>
  );
};
```

### Backend Implementation

**Auto-Grading Logic**:
```typescript
// backend/src/services/trainingGrader.ts
export async function gradeQuiz(
  workerId: string,
  domainType: string,
  answers: Record<string, string>
): Promise<{ score: number; passed: boolean; canRetry: boolean; retryAfter?: Date }> {
  // Get correct answers from database
  const { data: module } = await supabase
    .from('training_modules')
    .select('quiz_questions')
    .eq('domain_type', domainType)
    .single();

  const questions: QuizQuestion[] = module.quiz_questions;

  // Calculate score
  let correct = 0;
  questions.forEach((q) => {
    if (answers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase()) {
      correct++;
    }
  });

  const score = (correct / questions.length) * 100;
  const passed = score >= 70;

  // Check retry eligibility
  const { data: progress } = await supabase
    .from('worker_training_progress')
    .select('quiz_attempts, last_quiz_attempt_at')
    .eq('worker_id', workerId)
    .eq('domain_type', domainType)
    .single();

  const canRetry =
    !passed &&
    (!progress?.last_quiz_attempt_at ||
      new Date().getTime() - new Date(progress.last_quiz_attempt_at).getTime() >= 24 * 60 * 60 * 1000);

  const retryAfter = !canRetry && progress?.last_quiz_attempt_at
    ? new Date(new Date(progress.last_quiz_attempt_at).getTime() + 24 * 60 * 60 * 1000)
    : undefined;

  // Update progress
  await supabase
    .from('worker_training_progress')
    .upsert({
      worker_id: workerId,
      domain_type: domainType,
      quiz_attempts: (progress?.quiz_attempts || 0) + 1,
      quiz_passed: passed,
      quiz_score: score,
      last_quiz_attempt_at: new Date().toISOString(),
      certified: passed,
      certified_at: passed ? new Date().toISOString() : null,
    });

  // Update worker certifications if passed
  if (passed) {
    const { data: worker } = await supabase
      .from('workers')
      .select('certifications')
      .eq('id', workerId)
      .single();

    const certifications = worker?.certifications || [];
    if (!certifications.includes(domainType)) {
      await supabase
        .from('workers')
        .update({ certifications: [...certifications, domainType] })
        .eq('id', workerId);
    }
  }

  return { score, passed, canRetry, retryAfter };
}
```

---

## Tier Management Automation

### Supabase Functions for Automation

**Auto-Promotion Function**:
```sql
-- supabase/functions/auto_promote_workers.sql
CREATE OR REPLACE FUNCTION auto_promote_workers()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Find eligible workers
  WITH eligible_workers AS (
    SELECT
      w.id,
      w.total_completed_tasks,
      w.average_rating,
      w.tier
    FROM workers w
    WHERE w.tier = 1
      AND w.total_completed_tasks >= 20
      AND w.average_rating >= 4.2
  )
  UPDATE workers
  SET
    tier = 2,
    tier_updated_at = NOW()
  WHERE id IN (SELECT id FROM eligible_workers);

  -- Log tier changes
  INSERT INTO tier_changes (worker_id, old_tier, new_tier, reason, trigger_conditions, changed_at)
  SELECT
    id,
    1,
    2,
    'auto_promotion',
    jsonb_build_object(
      'total_completed_tasks', total_completed_tasks,
      'average_rating', average_rating
    ),
    NOW()
  FROM eligible_workers;

  -- Send notification emails (trigger notification service)
  -- This would be handled by a separate notification function
END;
$$;

-- Schedule this function to run daily
SELECT cron.schedule('auto-promote-workers', '0 0 * * *', 'SELECT auto_promote_workers();');
```

**Auto-Demotion Function**:
```sql
-- supabase/functions/auto_demote_workers.sql
CREATE OR REPLACE FUNCTION auto_demote_workers()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Find workers to demote (2 consecutive months < 4.0 rating)
  WITH eligible_for_demotion AS (
    SELECT
      w.id,
      w.last_month_rating,
      w.prev_month_rating,
      w.tier
    FROM workers w
    WHERE w.tier = 2
      AND w.last_month_rating < 4.0
      AND w.prev_month_rating < 4.0
  )
  UPDATE workers
  SET
    tier = 1,
    tier_updated_at = NOW()
  WHERE id IN (SELECT id FROM eligible_for_demotion);

  -- Log tier changes
  INSERT INTO tier_changes (worker_id, old_tier, new_tier, reason, trigger_conditions, changed_at)
  SELECT
    id,
    2,
    1,
    'auto_demotion',
    jsonb_build_object(
      'last_month_rating', last_month_rating,
      'prev_month_rating', prev_month_rating
    ),
    NOW()
  FROM eligible_for_demotion;

  -- Send warning emails
  -- Handled by notification service
END;
$$;

-- Schedule this function to run on the 1st of each month
SELECT cron.schedule('auto-demote-workers', '0 0 1 * *', 'SELECT auto_demote_workers();');
```

**Monthly Rating Calculation**:
```sql
-- supabase/functions/calculate_monthly_ratings.sql
CREATE OR REPLACE FUNCTION calculate_monthly_ratings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update previous month's rating
  UPDATE workers
  SET prev_month_rating = last_month_rating;

  -- Calculate last month's rating
  UPDATE workers w
  SET last_month_rating = (
    SELECT AVG(t.client_rating)
    FROM transactions t
    WHERE t.worker_id = w.id
      AND t.completed_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
      AND t.completed_at < DATE_TRUNC('month', NOW())
  );
END;
$$;

-- Run on the last day of each month
SELECT cron.schedule('calculate-monthly-ratings', '0 23 28-31 * *', 'SELECT calculate_monthly_ratings();');
```

### Payment Bonus Calculation

```typescript
// backend/src/services/paymentCalculator.ts
export function calculateWorkerPayout(
  taskAmount: number,
  workerTier: 1 | 2
): number {
  const baseAmount = taskAmount;
  const bonus = workerTier === 2 ? 0.20 : 0; // 20% bonus for Tier 2

  return baseAmount * (1 + bonus);
}

// Example:
// Task amount: $100
// Tier 1 worker: $100
// Tier 2 worker: $120 (20% bonus)
```

---

## Quality Control Automation

### Automatic Quality Checks

**Frontend Validation**:
```typescript
// frontend/src/utils/submissionValidator.ts
export async function validateSubmission(
  submission: {
    photos?: File[];
    gpsLocation?: { lat: number; lng: number };
    requiredFields: Record<string, any>;
  },
  task: {
    photoRequired: boolean;
    minPhotoResolution: number;
    locationRequired: boolean;
  }
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Required field check
  Object.keys(task.requiredFields).forEach((field) => {
    if (!submission.requiredFields[field]) {
      errors.push(`${field} is required`);
    }
  });

  // Photo validation
  if (task.photoRequired) {
    if (!submission.photos || submission.photos.length === 0) {
      errors.push('Photos are required');
    } else {
      for (const photo of submission.photos) {
        const quality = await validatePhotoQuality(photo);
        if (quality.resolution < task.minPhotoResolution) {
          errors.push(`Photo resolution too low: ${quality.resolution}p (min: ${task.minPhotoResolution}p)`);
        }
      }
    }
  }

  // GPS validation
  if (task.locationRequired && !submission.gpsLocation) {
    errors.push('GPS location is required');
  }

  return { valid: errors.length === 0, errors };
}
```

**Backend Quality Check**:
```typescript
// backend/src/services/qualityControl.ts
export async function performQualityCheck(
  submissionId: string,
  taskId: string
): Promise<{
  passed: boolean;
  requiredFieldsOk: boolean;
  photoQualityOk: boolean;
  gpsVerifiedOk: boolean;
  ratingBiasDetected: boolean;
  overallStatus: 'passed' | 'flagged' | 'failed';
  details: any;
}> {
  const { data: submission } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  // Check 1: Required fields
  const requiredFieldsOk = checkRequiredFields(submission, task);

  // Check 2: Photo quality
  let photoQualityOk = true;
  if (task.photo_required) {
    for (const photo of submission.photos) {
      const quality = await validatePhotoQuality(photo.buffer, task.min_photo_resolution);
      if (!quality.valid) {
        photoQualityOk = false;
        break;
      }
    }
  }

  // Check 3: GPS verification
  let gpsVerifiedOk = true;
  if (task.location_required) {
    const gpsResult = await verifyGPSLocation(
      submission.submission_location,
      task.task_location,
      task.radius_meters
    );
    gpsVerifiedOk = gpsResult.verified;

    // Check for GPS spoofing
    const spoofing = await detectGPSSpoofing(
      submission.worker_id,
      {
        lat: submission.submission_location.lat,
        lng: submission.submission_location.lng,
        timestamp: submission.submission_time,
      }
    );
    if (spoofing) gpsVerifiedOk = false;
  }

  // Check 4: Rating bias detection (from client evaluations)
  const ratingBiasDetected = await detectRatingBias(submission.worker_id);

  // Determine overall status
  const passed = requiredFieldsOk && photoQualityOk && gpsVerifiedOk && !ratingBiasDetected;
  const overallStatus = passed ? 'passed' : ratingBiasDetected ? 'flagged' : 'failed';

  // Save quality check result
  await supabase.from('quality_checks').insert({
    submission_id: submissionId,
    required_fields_ok: requiredFieldsOk,
    photo_quality_ok: photoQualityOk,
    gps_verified_ok: gpsVerifiedOk,
    rating_bias_detected: ratingBiasDetected,
    overall_status: overallStatus,
    check_details: {
      requiredFieldsOk,
      photoQualityOk,
      gpsVerifiedOk,
      ratingBiasDetected,
    },
  });

  return {
    passed,
    requiredFieldsOk,
    photoQualityOk,
    gpsVerifiedOk,
    ratingBiasDetected,
    overallStatus,
    details: {
      requiredFieldsOk,
      photoQualityOk,
      gpsVerifiedOk,
      ratingBiasDetected,
    },
  };
}

// Detect extreme rating bias (all 5s or all 1s)
async function detectRatingBias(workerId: string): Promise<boolean> {
  const { data: ratings } = await supabase
    .from('transactions')
    .select('client_rating')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!ratings || ratings.length < 5) return false;

  const all5s = ratings.every((r) => r.client_rating === 5);
  const all1s = ratings.every((r) => r.client_rating === 1);

  return all5s || all1s;
}
```

---

## Database Design

### Updated ER Diagram (v2.0)

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│    users    │        │    tasks     │        │ applications │
├─────────────┤        ├──────────────┤        ├──────────────┤
│ id (PK)     │────┐   │ id (PK)      │────┐   │ id (PK)      │
│ email       │    │   │ creator_id   │    │   │ task_id (FK) │
│ role        │    └──→│   (FK)       │    └──→│ worker_id(FK)│
│ full_name   │        │ domain_type  │  NEW   │ status       │
│ stripe_id   │        │ src_lang     │  NEW   │ cover_letter │
│ created_at  │        │ tgt_lang     │  NEW   └──────────────┘
└─────────────┘        │ task_loc     │  NEW
                       │ radius_m     │  NEW   ┌──────────────┐
┌─────────────┐        │ photo_req    │  NEW   │ transactions │
│   workers   │  NEW   └──────────────┘        ├──────────────┤
├─────────────┤                                 │ id (PK)      │
│ id (PK)     │        ┌──────────────┐         │ task_id (FK) │
│ user_id(FK) │        │task_submissions  NEW   │ amount       │
│ tier        │  NEW   ├──────────────┤         │ worker_tier  │  NEW
│ lang_pairs  │  NEW   │ id (PK)      │         │ bonus_amt    │  NEW
│ certs       │  NEW   │ task_id (FK) │         └──────────────┘
│ avg_rating  │  NEW   │ worker_id(FK)│
│ total_tasks │  NEW   │ submit_loc   │  NEW   ┌──────────────┐
└─────────────┘        │ photos       │  NEW   │training_modules  NEW
                       │ gps_verified │  NEW   ├──────────────┤
┌──────────────┐       └──────────────┘        │ id (PK)      │
│ai_verification  NEW                          │ domain_type  │
├──────────────┤       ┌──────────────┐        │ video_url    │
│ id (PK)      │       │quality_checks  NEW    │ exercises    │
│ task_id (FK) │       ├──────────────┤        │ quiz_qs      │
│ worker_id(FK)│       │ id (PK)      │        └──────────────┘
│ quality_score│       │ submit_id(FK)│
│ bias_detected│       │ fields_ok    │        ┌──────────────┐
└──────────────┘       │ photo_ok     │        │worker_progress  NEW
                       │ gps_ok       │        ├──────────────┤
                       │ rating_bias  │        │ id (PK)      │
                       └──────────────┘        │ worker_id(FK)│
                                               │ domain_type  │
                                               │ video_done   │
                                               │ quiz_passed  │
                                               └──────────────┘
```

### New/Updated Tables (v2.0)

#### **tasks Table (Updated)**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 1.00),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'approved', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  requirements JSONB,
  attachments TEXT[],

  -- NEW v2.0: Focus domain fields
  domain_type VARCHAR(50) DEFAULT 'generic'
    CHECK (domain_type IN ('translation', 'ai_verification', 'physical', 'generic')),

  -- Translation domain
  source_language VARCHAR(10),
  target_language VARCHAR(10),
  evaluation_criteria JSONB, -- {"accuracy": true, "naturalness": true}

  -- AI verification domain
  ai_content_type VARCHAR(50), -- 'text', 'image', 'response'
  bias_check_required BOOLEAN DEFAULT false,
  cultural_regions TEXT[], -- ['north_america', 'asia']

  -- Physical data domain
  location_required BOOLEAN DEFAULT false,
  task_location GEOGRAPHY(POINT, 4326), -- PostGIS
  radius_meters INTEGER,
  photo_required BOOLEAN DEFAULT false,
  min_photo_resolution INTEGER, -- 720, 1080, 2160

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_domain_type ON tasks(domain_type);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_tasks_location ON tasks USING GIST(task_location); -- PostGIS spatial index

-- RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published tasks viewable by all" ON tasks
  FOR SELECT USING (status != 'draft');

CREATE POLICY "Creators can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = creator_id);
```

#### **workers Table (NEW)**
```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Performance tier
  tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2)),
  tier_updated_at TIMESTAMP WITH TIME ZONE,
  total_completed_tasks INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  last_month_rating DECIMAL(3,2),
  prev_month_rating DECIMAL(3,2),

  -- Specializations
  language_pairs JSONB, -- [{"source": "en", "target": "ja", "proficiency": "native"}]
  specialized_domains TEXT[], -- ['translation', 'ai_verification']
  certifications TEXT[], -- ['translation', 'ai_verification', 'physical']

  -- Location
  current_location GEOGRAPHY(POINT, 4326), -- PostGIS
  location_updated_at TIMESTAMP WITH TIME ZONE,

  -- Stripe
  stripe_account_id TEXT UNIQUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workers_user ON workers(user_id);
CREATE INDEX idx_workers_tier ON workers(tier);
CREATE INDEX idx_workers_rating ON workers(average_rating DESC);
CREATE INDEX idx_workers_location ON workers USING GIST(current_location);

-- RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own data" ON workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Workers can update own data" ON workers
  FOR UPDATE USING (auth.uid() = user_id);
```

#### **training_modules Table (NEW)**
```sql
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_type VARCHAR(50) NOT NULL CHECK (domain_type IN ('translation', 'ai_verification', 'physical')),
  module_order INTEGER DEFAULT 1,

  -- Video
  video_url TEXT NOT NULL,
  video_duration_minutes INTEGER NOT NULL,

  -- Exercises
  exercises JSONB, -- [{"type": "multiple_choice", "question": "...", "options": [...], "correct": "..."}]

  -- Quiz
  quiz_questions JSONB, -- [{"id": "q1", "type": "...", "question": "...", "correctAnswer": "..."}]

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(domain_type, module_order)
);

-- RLS: Public read access for training content
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Training modules viewable by all" ON training_modules
  FOR SELECT USING (true);
```

#### **worker_training_progress Table (NEW)**
```sql
CREATE TABLE worker_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  domain_type VARCHAR(50) NOT NULL,

  -- Video
  video_completed BOOLEAN DEFAULT false,
  video_watched_at TIMESTAMP WITH TIME ZONE,

  -- Exercises
  exercises_completed BOOLEAN DEFAULT false,
  exercises_score DECIMAL(5,2),

  -- Quiz
  quiz_attempts INTEGER DEFAULT 0,
  quiz_passed BOOLEAN DEFAULT false,
  quiz_score DECIMAL(5,2),
  last_quiz_attempt_at TIMESTAMP WITH TIME ZONE,

  -- Certification
  certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(worker_id, domain_type)
);

-- Indexes
CREATE INDEX idx_training_progress_worker ON worker_training_progress(worker_id);
CREATE INDEX idx_training_progress_certified ON worker_training_progress(certified);

-- RLS
ALTER TABLE worker_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own progress" ON worker_training_progress
  FOR SELECT USING (worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid()));

CREATE POLICY "Workers can update own progress" ON worker_training_progress
  FOR ALL USING (worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid()));
```

#### **task_submissions Table (NEW)**
```sql
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

  -- Location data (for physical tasks)
  submission_location GEOGRAPHY(POINT, 4326),
  submission_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Photos (for physical tasks)
  photos JSONB, -- [{"url": "...", "resolution": "1920x1080", "exif": {...}}]

  -- Quality flags
  gps_verified BOOLEAN DEFAULT false,
  photo_quality_score INTEGER,

  -- General submission data
  submission_data JSONB, -- Domain-specific submission content

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_submissions_task ON task_submissions(task_id);
CREATE INDEX idx_submissions_worker ON task_submissions(worker_id);
CREATE INDEX idx_submissions_location ON task_submissions USING GIST(submission_location);

-- RLS
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage own submissions" ON task_submissions
  FOR ALL USING (worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid()));

CREATE POLICY "Task creators can view submissions" ON task_submissions
  FOR SELECT USING (
    task_id IN (SELECT id FROM tasks WHERE creator_id = auth.uid())
  );
```

#### **ai_verification_results Table (NEW)**
```sql
CREATE TABLE ai_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  bias_detected BOOLEAN DEFAULT false,
  bias_details TEXT,
  hallucination_detected BOOLEAN DEFAULT false,
  hallucination_details TEXT,
  cultural_appropriateness JSONB, -- {"north_america": 4, "asia": 3}
  improvement_suggestions TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_results_task ON ai_verification_results(task_id);
CREATE INDEX idx_ai_results_worker ON ai_verification_results(worker_id);

-- RLS
ALTER TABLE ai_verification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage own AI results" ON ai_verification_results
  FOR ALL USING (worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid()));

CREATE POLICY "Task creators can view AI results" ON ai_verification_results
  FOR SELECT USING (
    task_id IN (SELECT id FROM tasks WHERE creator_id = auth.uid())
  );
```

#### **quality_checks Table (NEW)**
```sql
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,

  required_fields_ok BOOLEAN DEFAULT true,
  photo_quality_ok BOOLEAN DEFAULT true,
  gps_verified_ok BOOLEAN DEFAULT true,
  rating_bias_detected BOOLEAN DEFAULT false,

  overall_status VARCHAR(20) CHECK (overall_status IN ('passed', 'flagged', 'failed')),
  check_details JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quality_checks_submission ON quality_checks(submission_id);
CREATE INDEX idx_quality_checks_status ON quality_checks(overall_status);

-- RLS
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quality checks viewable by involved parties" ON quality_checks
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM task_submissions
      WHERE worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid())
         OR task_id IN (SELECT id FROM tasks WHERE creator_id = auth.uid())
    )
  );
```

#### **tier_changes Table (NEW)**
```sql
CREATE TABLE tier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  old_tier INTEGER NOT NULL,
  new_tier INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'auto_promotion', 'auto_demotion'
  trigger_conditions JSONB, -- {"total_completed_tasks": 20, "average_rating": 4.5}
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tier_changes_worker ON tier_changes(worker_id);
CREATE INDEX idx_tier_changes_date ON tier_changes(changed_at DESC);

-- RLS
ALTER TABLE tier_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own tier changes" ON tier_changes
  FOR SELECT USING (worker_id IN (SELECT id FROM workers WHERE user_id = auth.uid()));
```

#### **problem_reports Table (NEW)**
```sql
CREATE TABLE problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_worker_id UUID REFERENCES workers(id),

  issue_type VARCHAR(50) CHECK (issue_type IN ('quality', 'fraud', 'inappropriate', 'gps_spoofing', 'other')),
  description TEXT NOT NULL,
  evidence JSONB, -- Photos, screenshots, etc.

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  resolution TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_problem_reports_task ON problem_reports(task_id);
CREATE INDEX idx_problem_reports_status ON problem_reports(status);

-- RLS
ALTER TABLE problem_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can view own reports" ON problem_reports
  FOR ALL USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON problem_reports
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
```

#### **transactions Table (Updated)**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id),
  worker_id UUID NOT NULL REFERENCES workers(id),

  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  worker_payout DECIMAL(10, 2) NOT NULL,

  -- NEW v2.0: Tier bonus tracking
  worker_tier INTEGER DEFAULT 1,
  tier_bonus_amount DECIMAL(10, 2) DEFAULT 0,

  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'captured', 'transferred', 'refunded', 'failed')),

  -- NEW v2.0: Client rating
  client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),
  client_feedback TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captured_at TIMESTAMP WITH TIME ZONE,
  transferred_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_transactions_task ON transactions(task_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_worker ON transactions(worker_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM workers WHERE id = worker_id)
  );
```

---

## API Design

### RESTful Endpoints

#### **Authentication (via Supabase Auth)**

```
POST   /auth/signup          # User registration
POST   /auth/login           # Login
POST   /auth/logout          # Logout
POST   /auth/reset-password  # Password reset
GET    /auth/me              # Get current user info
```

#### **User Management**

```
GET    /api/users/:id        # Get user details
PUT    /api/users/:id        # Update user info
GET    /api/users/:id/tasks  # Get user's tasks
GET    /api/users/:id/stats  # Get user statistics
```

#### **Task Management (Updated)**

```
GET    /api/tasks            # Get task list (with filters, sort)
POST   /api/tasks            # Create generic task
GET    /api/tasks/:id        # Get task details
PUT    /api/tasks/:id        # Update task
DELETE /api/tasks/:id        # Delete task
POST   /api/tasks/:id/publish # Publish task
POST   /api/tasks/:id/cancel  # Cancel task

# NEW v2.0: Focus domain specialized endpoints
POST   /api/tasks/translation          # Create translation task
POST   /api/tasks/ai-verification      # Create AI verification task
POST   /api/tasks/physical-data        # Create physical data task

# NEW v2.0: Worker matching
GET    /api/tasks/:id/matching-workers # Get workers matching task requirements
GET    /api/workers/by-language-pair   # Find workers by language pair
GET    /api/workers/nearby/:taskId     # Find workers near task location
```

#### **Application Management**

```
GET    /api/applications              # Get applications list (own)
POST   /api/tasks/:id/applications    # Apply to task
GET    /api/applications/:id          # Get application details
PUT    /api/applications/:id          # Update application
DELETE /api/applications/:id          # Withdraw application
POST   /api/applications/:id/accept   # Accept application (creator only)
POST   /api/applications/:id/reject   # Reject application (creator only)
```

#### **Training & Certification (NEW v2.0)**

```
GET    /api/training/:domain           # Get training module for domain
POST   /api/training/video-progress    # Record video viewing progress
POST   /api/training/submit-exercise   # Submit exercise & get instant feedback
POST   /api/training/submit-quiz       # Submit quiz & get instant grading
GET    /api/training/my-progress       # Get worker's training progress
GET    /api/training/my-certifications # Get worker's certifications
```

#### **Submission & Evaluation (NEW v2.0)**

```
POST   /api/submissions/physical-data  # Submit physical data task
POST   /api/submissions/verify-gps     # Verify GPS location
POST   /api/submissions/upload-photo   # Upload & validate photo
POST   /api/submissions/quality-check  # Run automated quality check

POST   /api/evaluations/translation    # Submit translation evaluation
POST   /api/evaluations/ai-quality     # Submit AI quality evaluation
GET    /api/evaluations/:taskId        # Get evaluation results
```

#### **Worker Tier System (NEW v2.0)**

```
GET    /api/workers/tier-status        # Get current tier status
GET    /api/workers/tier-progress      # Get progress toward next tier
GET    /api/workers/tier-history       # Get tier change history
```

#### **Quality & Reports (NEW v2.0)**

```
POST   /api/reports/problem            # Report a problem
GET    /api/reports/my-reports         # Get my problem reports
GET    /api/admin/reports              # Get all reports (admin only)
PATCH  /api/admin/reports/:id          # Update report status (admin only)
```

#### **Payment Related**

```
POST   /api/stripe/onboarding         # Start Stripe Connect onboarding
GET    /api/stripe/account-status     # Check Stripe Connect account status
POST   /api/stripe/create-payment     # Create payment (authorization)
POST   /api/stripe/capture-payment    # Capture payment
POST   /api/stripe/refund             # Process refund
POST   /api/webhooks/stripe           # Receive Stripe webhooks
```

### API Request/Response Examples (v2.0)

#### **Create Translation Task**

**Request**:
```http
POST /api/tasks/translation
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "title": "Validate Japanese localization for mobile app",
  "description": "Review 50 UI strings translated from English to Japanese...",
  "sourceLanguage": "en",
  "targetLanguage": "ja",
  "documentType": "technical",
  "industry": "software",
  "wordCount": 500,
  "amount": 25.00,
  "deadline": "2025-11-15T23:59:59Z",
  "evaluationCriteria": {
    "accuracy": true,
    "naturalness": true,
    "culturalAppropriateness": true
  }
}
```

**Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "creator_id": "user-id-123",
  "title": "Validate Japanese localization for mobile app",
  "domain_type": "translation",
  "source_language": "en",
  "target_language": "ja",
  "amount": 25.00,
  "status": "draft",
  "created_at": "2025-10-31T10:00:00Z"
}
```

#### **Submit AI Verification Result**

**Request**:
```http
POST /api/evaluations/ai-quality
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "taskId": "task-uuid-456",
  "qualityScore": 4,
  "biasDetected": true,
  "biasDetails": "Gender bias detected in pronoun usage, assumes male default.",
  "hallucinationDetected": false,
  "culturalAppropriateness": {
    "north_america": 5,
    "asia": 3
  },
  "improvementSuggestions": "Use gender-neutral language. Consider cultural context for Asian markets."
}
```

**Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "result-uuid-789",
  "task_id": "task-uuid-456",
  "worker_id": "worker-uuid-123",
  "quality_score": 4,
  "bias_detected": true,
  "created_at": "2025-10-31T11:00:00Z"
}
```

#### **Submit Physical Data with GPS & Photos**

**Request**:
```http
POST /api/submissions/physical-data
Authorization: Bearer <supabase-jwt-token>
Content-Type: multipart/form-data

{
  "taskId": "task-uuid-999",
  "latitude": "5.603717",
  "longitude": "-0.186964",
  "photos": [<file1.jpg>, <file2.jpg>],
  "submissionData": {
    "storeName": "Shop ABC",
    "priceObserved": "$9.99",
    "availability": "in_stock"
  }
}
```

**Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "submission-uuid-111",
  "task_id": "task-uuid-999",
  "worker_id": "worker-uuid-123",
  "gps_verified": true,
  "photo_quality_score": 5,
  "submission_location": {
    "lat": 5.603717,
    "lng": -0.186964
  },
  "photos": [
    {
      "url": "https://storage.supabase.co/...",
      "resolution": "1920x1080",
      "exif": { "GPSLatitude": 5.603717, "DateTime": "..." }
    }
  ],
  "created_at": "2025-10-31T12:00:00Z"
}
```

---

## Authentication & Authorization

(Same as v1.0, no changes needed)

### Supabase Auth Integration

#### **Authentication Flow**

```
1. User registers with email/password
   ↓
2. Supabase sends confirmation email
   ↓
3. User clicks link in email
   ↓
4. Email confirmed, login enabled
   ↓
5. JWT issued upon login
   ↓
6. Frontend stores JWT in localStorage
   ↓
7. JWT added to Authorization header for subsequent API calls
```

#### **JWT Structure**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890
}
```

#### **Row Level Security (RLS)**

Supabase's powerful feature: database-level access control.

**Example: Task viewing permissions**
```sql
-- Published tasks viewable by all
CREATE POLICY "Public tasks viewable" ON tasks
  FOR SELECT USING (status = 'published');

-- Draft tasks viewable only by creator
CREATE POLICY "Draft tasks viewable by creator" ON tasks
  FOR SELECT USING (
    status = 'draft' AND auth.uid() = creator_id
  );
```

### Authorization Logic

#### **Role Definition**

```typescript
enum UserRole {
  CLIENT = 'client',    // Task client side
  WORKER = 'worker',    // Task worker side
  BOTH = 'both'         // Both
}
```

#### **Permission Matrix**

| Action | CLIENT | WORKER | BOTH |
|--------|--------|--------|------|
| Create Task | ✅ | ❌ | ✅ |
| View Task | ✅ | ✅ | ✅ |
| Apply to Task | ❌ | ✅ | ✅ |
| Accept Application | ✅(own tasks) | ❌ | ✅(own tasks) |

---

## Stripe Connect Integration

(Same as v1.0, with addition of tier bonus calculation)

### Architecture

**Stripe Features Used**:
- **Stripe Connect** (Custom Accounts)
- **Payment Intents** (payment management)
- **Transfers** (transfers to workers)
- **Webhooks** (event notifications)

### Payment Flow Details

#### **Phase 1: Connect Account Creation**

```
1. Worker prompted to register bank account on first application
   ↓
2. Backend creates Stripe Connect Account
   POST /api/stripe/onboarding
   ↓
3. Stripe returns Connect Onboarding URL
   ↓
4. Worker inputs bank account info in Stripe form
   ↓
5. Stripe sends account.updated webhook
   ↓
6. TaskBridge saves worker's stripe_account_id
```

#### **Phase 2: Payment Processing (Updated for Tier Bonuses)**

```
1. Pre-authorize payment when task is posted (Authorization)
   ↓
2. Hold $120 ($100 task + 18% fee) on card
   ↓
3. Worker completes and submits task
   ↓
4. Company approves or auto-approve after 7 days
   ↓
5. Execute actual payment (Capture)
   ↓
6. Calculate worker payout based on tier:
   - Tier 1: $100
   - Tier 2: $120 (20% bonus)
   ↓
7. Automatically transfer to worker's Connect account (Transfer)
   ↓
8. Platform revenue: $18 (fee) - $6.72 (Stripe) - $20 (bonus if Tier 2) = varies
```

**Implementation Example (Updated)**:
```typescript
// backend/src/services/payment.ts

// Capture + Transfer with Tier Bonus
export async function captureAndTransfer(
  paymentIntentId: string,
  workerAccountId: string,
  taskAmount: number,
  workerTier: 1 | 2
) {
  // Calculate worker payout with tier bonus
  const baseAmount = taskAmount;
  const tierBonus = workerTier === 2 ? baseAmount * 0.20 : 0;
  const totalPayout = baseAmount + tierBonus;

  // Capture payment
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

  // Transfer to worker
  const transfer = await stripe.transfers.create({
    amount: Math.round(totalPayout * 100), // $100 or $120 in cents
    currency: 'usd',
    destination: workerAccountId,
    transfer_group: paymentIntent.id,
  });

  // Update DB
  await supabase
    .from('transactions')
    .update({
      status: 'transferred',
      worker_tier: workerTier,
      tier_bonus_amount: tierBonus,
      stripe_transfer_id: transfer.id,
      transferred_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  return { paymentIntent, transfer };
}
```

---

## Security Design

(Same as v1.0 with additions for GPS and photo security)

### Threat Model (Updated v2.0)

| Threat | Countermeasure |
|--------|----------------|
| SQL Injection | Use Supabase ORM (parameterized queries) |
| XSS Attacks | React default escaping, use DOMPurify |
| CSRF Attacks | Supabase JWT auth (no cookies) |
| Credential Leakage | Short JWT expiry, use Refresh Token |
| Unauthorized Access | Row Level Security, API Rate Limiting |
| Payment Fraud | Stripe Radar fraud detection |
| **GPS Spoofing** | **Speed heuristics, location history checks** |
| **Photo Manipulation** | **EXIF validation, resolution checks** |
| **Rating Manipulation** | **Bias detection algorithms** |

### Security Best Practices

#### **1. Environment Variable Management**

```bash
# .env.example (commit to Git)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# .env (NEVER commit to Git)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx... # Confidential!
STRIPE_SECRET_KEY=sk_test_xxx # Confidential!
STRIPE_WEBHOOK_SECRET=whsec_xxx # Confidential!
```

#### **2. API Rate Limiting**

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests
  message: 'Too many requests, please try again later.',
});

// Apply to specific endpoints
app.use('/api/', apiLimiter);
```

#### **3. Input Validation (Updated v2.0)**

```typescript
// Strict validation using Zod
import { z } from 'zod';

const translationTaskSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  sourceLanguage: z.string().length(2),
  targetLanguage: z.string().length(2),
  amount: z.number().min(1).max(10000),
  deadline: z.string().datetime().optional(),
});

const physicalDataSubmissionSchema = z.object({
  taskId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photos: z.array(z.any()).min(1).max(10),
});

// Request validation
app.post('/api/tasks/translation', async (req, res) => {
  try {
    const validated = translationTaskSchema.parse(req.body);
    // Continue processing
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input', details: error.errors });
  }
});
```

---

## Deployment Strategy

(Same as v1.0, no changes)

---

## Development Workflow

(Same as v1.0, no changes)

---

## Performance Optimization

(Same as v1.0, with additions for v2.0)

### Frontend

#### **1. Code Splitting**
```typescript
// Split by route using React.lazy()
const TaskList = React.lazy(() => import('./pages/TaskList'));
const TrainingModule = React.lazy(() => import('./pages/TrainingModule'));
const PhysicalDataSubmission = React.lazy(() => import('./pages/PhysicalDataSubmission'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/tasks" element={<TaskList />} />
    <Route path="/training/:domain" element={<TrainingModule />} />
    <Route path="/submit/:taskId" element={<PhysicalDataSubmission />} />
  </Routes>
</Suspense>
```

#### **2. Image Optimization (NEW v2.0)**
- Use WebP format
- Lazy Loading (react-lazyload)
- CDN delivery (Vercel auto-handles)
- **Photo compression before upload** (Sharp on frontend via WASM)
- **Progressive JPEG for large images**

#### **3. Caching Strategy**
```typescript
// Cache server state with React Query
const { data: tasks } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => fetchTasks(filters),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  cacheTime: 10 * 60 * 1000, // Keep for 10 minutes
});

// NEW v2.0: Cache training modules
const { data: trainingModule } = useQuery({
  queryKey: ['training', domainType],
  queryFn: () => fetchTrainingModule(domainType),
  staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
});
```

---

### Backend

#### **1. Database Query Optimization (Updated v2.0)**
- Create appropriate indexes
- Avoid N+1 problem (use JOIN)
- Implement pagination
- **Use PostGIS spatial indexes for location queries**
- **Optimize JSONB queries with GIN indexes**

```sql
-- Example: Optimize language pair queries
CREATE INDEX idx_workers_language_pairs ON workers USING GIN(language_pairs);

-- Example: Optimize location queries
CREATE INDEX idx_tasks_location ON tasks USING GIST(task_location);
CREATE INDEX idx_workers_location ON workers USING GIST(current_location);
```

#### **2. API Response Caching**
```typescript
// Cache API responses with NodeCache
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

app.get('/api/tasks', async (req, res) => {
  const cacheKey = JSON.stringify(req.query);
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const tasks = await fetchTasks(req.query);
  cache.set(cacheKey, tasks);
  res.json(tasks);
});
```

---

## Monitoring & Logging

(Same as v1.0)

---

## Troubleshooting

### Common Issues and Solutions (Updated v2.0)

| Issue | Cause | Solution |
|-------|-------|----------|
| Supabase connection error | Environment variables not set | Check `.env` file |
| Stripe webhook failure | Webhook secret mismatch | Re-obtain from Stripe dashboard |
| CORS error | Backend configuration issue | Check Express cors settings |
| Authentication error | JWT expired | Implement refresh token |
| Payment failure | Test card use | Use Stripe test cards |
| **PostGIS error** | **Extension not enabled** | **Enable in Supabase SQL Editor** |
| **GPS verification failing** | **Incorrect coordinate order** | **Use [lng, lat] for GeoJSON** |
| **Photo upload timeout** | **File too large** | **Compress before upload** |
| **Quiz auto-grading error** | **Answer key mismatch** | **Verify quiz_questions schema** |

---

## Next Steps

### Week 1 Technical Tasks (v2.0)

**Ghana Side (Development)**:
1. [ ] Create Supabase project, enable PostGIS extension
2. [ ] Implement v2.0 DB schema (all new tables + updated tables)
3. [ ] Setup React + TypeScript + Tailwind environment
4. [ ] Integrate Supabase Auth, implement authentication flow
5. [ ] Implement focus domain 1: Translation forms
6. [ ] Implement basic training module viewer
7. [ ] Setup Stripe Connect integration

**Japan Side (Planning & Content)**:
1. [ ] Create training videos for 3 domains (Loom)
2. [ ] Write quiz questions and answer keys
3. [ ] Prepare sample tasks for certification tests
4. [ ] Document API requirements for Ghana team

**Reference Resources**:
- Supabase Docs: https://supabase.com/docs
- PostGIS Tutorial: https://postgis.net/workshops/postgis-intro/
- Stripe Connect Guide: https://stripe.com/docs/connect
- React Query: https://tanstack.com/query
- Sharp (Image Processing): https://sharp.pixelplumbing.com/

---

**Update History**:
- 2025-10-31: v2.0 Major update - Focus domains, automation systems, training, tier management
- 2025-10-30: v1.0 Initial release
