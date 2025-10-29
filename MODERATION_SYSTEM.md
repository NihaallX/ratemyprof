# 🛡️ Content Moderation & AI Filtering System

## Overview

RateMyProf uses a **multi-layered AI/ML-powered moderation system** to automatically detect and flag inappropriate content before it reaches the platform.

---

## 🤖 AI/ML Components

### 1. **Profanity Detection** 
**Library**: `better-profanity` (Python)

- **What it does**: Scans text for offensive words and inappropriate language
- **Custom wordlist**: Extended with academic context-inappropriate terms:
  - Academic slurs: "stupid", "idiot", "dumb", "moron", "retard"
  - Internet slang: "wtf", "stfu", "gtfo"
  - Mild profanity: "damn", "hell", "crap", "suck", "sucks"
- **Scoring**: Calculates percentage of profane words in text
- **Threshold**: **30%** - if 30% or more words are profane → auto-flag
- **Censoring**: Can automatically replace bad words with asterisks

### 2. **Sentiment Analysis**
**Library**: `TextBlob` (Natural Language Processing)

- **What it does**: Analyzes emotional tone of review text
- **Scale**: -1.0 (very negative) to +1.0 (very positive)
- **Threshold**: **-0.8** - extremely negative reviews are auto-flagged
- **Purpose**: Catches hateful or abusive content that may not contain explicit profanity
- **Example**: 
  - "This professor is terrible and I hate everything about this class" → Very negative sentiment
  - "Not great but manageable" → Mildly negative (OK)

### 3. **Spam Detection**
**Technology**: Pattern matching + ML classifier

**Detects**:
- URLs and links: `http://`, `www.`, `.com`, `.org`
- Phone numbers: various formats detected
- Email addresses: `something@email.com`
- Repetitive characters: "aaaaaaaa", "!!!!!!!!"
- Promotional keywords: "click here", "sign up", "limited offer"
- All caps text: "CHECK THIS OUT NOW"
- Excessive emojis or special characters

**Scoring**: Percentage of spam indicators detected
**Threshold**: **70%** - if 70% or more indicators present → auto-flag

### 4. **Quality Analysis**
**Technology**: Custom keyword and pattern analysis

**Checks for**:
- **Good indicators**: 
  - Educational terms: "learned", "understood", "helpful", "clear", "engaging"
  - Specific details: course names, teaching methods, examples
  - Minimum length: substantial text (not one-word reviews)
  
- **Bad indicators**:
  - One-word reviews: "ok", "good", "bad", "nice", "cool", "whatever", "meh"
  - Vague text: "idk", "dunno", "yeah", "nah", "fine", "alright"
  - No meaningful content

**Scoring**: 0.0 (very poor) to 1.0 (excellent quality)
**Threshold**: **0.3** - below 30% quality → auto-flag

---

## 🔄 Content Filtering Pipeline

```
User Submits Review
        ↓
┌───────────────────────────────┐
│  1. Review Saved to Database  │
│     Status: "pending"         │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  2. Background Task Started   │
│     (doesn't block user)      │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  3. Profanity Check           │
│     Is profane? Score?        │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  4. Spam Detection            │
│     Contains spam patterns?   │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  5. Quality Analysis          │
│     Meaningful content?       │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  6. Sentiment Analysis        │
│     Too negative/hateful?     │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  7. Auto-Flag Decision        │
│     If ANY threshold exceeded │
└───────────────────────────────┘
        ↓
   ┌─────────┴─────────┐
   │                   │
 FLAG                 OK
   │                   │
   ↓                   ↓
"pending"         "pending"
(needs admin)     (ready for admin approval)
```

---

## 📊 Current Thresholds

| **Filter Type** | **Threshold** | **Action** |
|----------------|---------------|------------|
| **Profanity** | 30% bad words | Auto-flag |
| **Spam** | 70% spam indicators | Auto-flag |
| **Quality** | Below 30% quality | Auto-flag |
| **Sentiment** | Below -0.8 (very negative) | Auto-flag |

---

## 🎯 What Gets Auto-Flagged?

### ❌ Examples that WOULD be flagged:

1. **High Profanity**:
   ```
   "This f***ing professor is a complete idiot and moron"
   → Profanity score: 50% → AUTO-FLAGGED
   ```

2. **Spam**:
   ```
   "Check out my website www.fakereviews.com for more info!!! 
   Call 123-456-7890 NOW!!!"
   → Spam score: 80% → AUTO-FLAGGED
   ```

3. **Low Quality**:
   ```
   "ok"
   → Quality score: 0.1 → AUTO-FLAGGED
   ```

4. **Extremely Negative**:
   ```
   "I absolutely hate this professor, worst experience ever, 
   terrible in every way, complete waste of time"
   → Sentiment: -0.9 → AUTO-FLAGGED
   ```

### ✅ Examples that PASS:

```
"The professor was very knowledgeable and explained concepts clearly. 
However, the workload was quite heavy and deadlines were tight. 
Overall, I learned a lot but it was challenging."
```
- Profanity: 0%
- Spam: 0%
- Quality: 0.85 (high - specific details, balanced)
- Sentiment: -0.1 (slightly negative but reasonable)
- **Result**: NOT flagged, ready for admin approval

---

## 🗄️ Database Tables

### `content_analysis_logs`
Stores analysis results for every review:
```sql
- review_id (UUID)
- profanity_score (0.0-1.0)
- spam_score (0.0-1.0)
- quality_score (0.0-1.0)
- sentiment_score (-1.0 to 1.0)
- auto_flagged (boolean)
- flag_reasons (text array)
- analyzed_at (timestamp)
```

### `college_content_analysis_logs`
Same structure for college reviews

---

## 🔧 Admin Tools

### 1. **Content Analysis Tester** (`/admin` → Content Filtering tab)
- Paste any text
- Click "Analyze Content"
- See real-time scores for:
  - Profanity detection
  - Spam detection
  - Quality analysis
  - Sentiment analysis
- View if it would be auto-flagged and why

### 2. **Filter Statistics Dashboard**
- Total reviews analyzed
- Total auto-flags created
- Distribution by flag type
- Current threshold settings

### 3. **Analysis Logs Viewer**
- See last 50 analyzed reviews
- Filter by professor/college reviews
- Filter by auto-flagged only
- View scores for each review

### 4. **Bulk Re-Analysis**
- Re-run content filter on ALL existing reviews
- Useful after updating thresholds or detection patterns

---

## 🚀 Implementation Status

### ✅ **IMPLEMENTED & WORKING**:

1. **Professor Reviews** ✅
   - Content filtering runs on every submission
   - Background task processes asynchronously
   - Analysis logged to database
   - Auto-flags created if thresholds exceeded

2. **College Reviews** ✅ (JUST ADDED!)
   - Same filtering system now active
   - Was missing - fixed in commit `ee9146e`

3. **Admin Panel** ✅
   - Test analyzer
   - Statistics dashboard
   - Logs viewer
   - All functional

### 📦 **Required Python Libraries**:

```python
better-profanity==0.7.0    # Profanity detection
textblob==0.17.1           # Sentiment analysis
nltk==3.8.1                # Natural language toolkit
scikit-learn==1.3.0        # ML classifier for spam detection
```

Install with:
```bash
cd backend
pip install better-profanity textblob nltk scikit-learn
```

---

## 🔐 How It Works Technically

### Step 1: Review Submission
```python
# In reviews.py / college_reviews.py
@router.post("")
async def create_review(
    request: ReviewCreate,
    background_tasks: BackgroundTasks,  # FastAPI background tasks
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # ... create review ...
    
    # Schedule content analysis (doesn't block response)
    auto_flagging = AutoFlaggingSystem(supabase)
    background_tasks.add_task(
        auto_flagging.process_review_content,
        review_id,
        review_text,
        user_id
    )
```

### Step 2: Content Analysis
```python
# In services/content_filter.py
class ContentFilter:
    def analyze_content(self, text: str) -> ContentAnalysis:
        # 1. Check profanity
        is_profane, profanity_score = self._analyze_profanity(text)
        
        # 2. Check spam
        is_spam, spam_score = self._analyze_spam(text)
        
        # 3. Check quality
        quality_score = self._analyze_quality(text)
        
        # 4. Check sentiment
        sentiment_score = self._analyze_sentiment(text)
        
        # 5. Decide if should auto-flag
        auto_flag, reasons = self._determine_auto_flag(...)
        
        return ContentAnalysis(
            is_profane=is_profane,
            profanity_score=profanity_score,
            is_spam=is_spam,
            spam_score=spam_score,
            quality_score=quality_score,
            sentiment_score=sentiment_score,
            auto_flag=auto_flag,
            flag_reasons=reasons
        )
```

### Step 3: Auto-Flagging
```python
# In services/auto_flagging.py
async def process_review_content(self, review_id, review_text, user_id):
    # Run content filter
    analysis = content_filter.analyze_content(review_text)
    
    # If should flag
    if analysis.auto_flag:
        # Create flag records in database
        await self._create_auto_flags(review_id, analysis.flag_reasons, user_id)
        
        # Update review status to "pending" (needs admin review)
        await self._update_review_moderation_status(review_id, "pending")
    
    # Log analysis for monitoring
    await self._log_content_analysis(review_id, analysis)
```

---

## 📈 Monitoring & Metrics

### Available Stats:
- **Total reviews analyzed**: All-time count
- **Auto-flags created**: Number of reviews caught
- **Flag type distribution**: 
  - Profanity: X reviews
  - Spam: Y reviews
  - Low quality: Z reviews
  - Negative sentiment: W reviews
- **Filter effectiveness**: % of reviews flagged

### Access Stats:
1. Login as admin
2. Go to `/admin`
3. Click "Content Filtering" tab
4. View "Statistics" section

---

## 🎯 Future Enhancements

### Potential Improvements:
1. **Machine Learning Spam Classifier**
   - Train on historical spam/not-spam data
   - More accurate than pattern matching
   
2. **Custom Profanity Dictionary**
   - Add Indian English slang/context
   - Region-specific inappropriate terms

3. **Adjustable Thresholds**
   - Admin UI to change thresholds without code changes
   - A/B testing different strictness levels

4. **False Positive Handling**
   - "Mark as False Positive" button in admin
   - Train system to improve over time

5. **Review Appeal System**
   - Let users contest auto-flags
   - Admin review of appeals

---

## ✅ Verification

To test if moderation is working:

1. **Submit a test review with profanity**:
   ```
   "This is a f***ing terrible professor"
   ```
   **Expected**: Review created with status "pending", auto-flagged

2. **Check admin panel**:
   - Go to `/admin` → Pending Reviews
   - Should see the flagged review
   - Should show "Auto-flagged: Contains profanity"

3. **View analysis logs**:
   - Go to `/admin` → Content Filtering → Analysis Logs
   - Should see the review with high profanity score

---

## 🔑 Key Files

| **File** | **Purpose** |
|----------|-------------|
| `backend/src/services/content_filter.py` | Core AI/ML filtering logic |
| `backend/src/services/auto_flagging.py` | Auto-flagging system |
| `backend/src/api/reviews.py` | Professor review endpoints (with filtering) |
| `backend/src/api/college_reviews.py` | College review endpoints (with filtering) |
| `backend/src/api/moderation.py` | Admin moderation endpoints |
| `frontend/src/components/ContentFilteringPanel.tsx` | Admin UI for filter testing |

---

## 🚨 Important Notes

1. **All reviews start as "pending"** - even if they pass all filters, they still need admin approval before going live. This is a **two-step moderation process**:
   - Step 1: Automated filtering (catches obvious bad content)
   - Step 2: Human review (admin approves/rejects)

2. **Background processing** - Content analysis happens asynchronously so users don't wait for AI processing

3. **Privacy-preserving** - Analysis logs don't store user identity, only review IDs

4. **Customizable** - All thresholds and patterns can be adjusted in `content_filter.py`

---

## 📞 Support

For questions or issues with the moderation system:
- **Email**: nihalpardeshi12344@gmail.com
- **Admin Dashboard**: `/admin` (requires admin login)
