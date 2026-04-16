# Fuel Rush — Beta Testing Guide

> Last updated: 2026-03-27

Welcome to the **Fuel Rush Beta**! 🚀 We're testing Bangladesh's first AI-powered fuel intelligence platform. Your feedback directly shapes the final product.

---

## 📋 How to Join Beta

### Option 1: GitHub Issues
1. Go to [github.com/adnanizaman-star/fuel-Rush/issues](https://github.com/adnanizaman-star/fuel-Rush/issues)
2. Click **New Issue**
3. Select the **Bug Report** or **Feature Request** template
4. Fill in the details and submit

### Option 2: Telegram Group
> **Telegram Link:** [PLACEHOLDER — will be shared soon]

Join our beta testers group to:
- Report bugs in real-time
- Discuss features and UX
- Get direct support from the team
- Vote on upcoming features

### Who Can Join?
- ✅ Any Bangladeshi Android user with a phone number
- ✅ Developers who want to contribute
- ✅ Drivers, riders, and anyone affected by fuel scarcity
- ✅ **No commitment required** — test at your own pace

---

## 🧪 Test Scenarios

Complete each scenario and report your results below.

---

### Scenario 1: Report Fuel Status

**Goal:** Submit a fuel status report for a station and verify it updates in real-time.

**Steps:**
1. Open Fuel Rush → go to **Map** tab
2. Tap any station marker
3. Tap **"Report Status"**
4. Select status: 🟢 Available | 🟡 Low Stock | 🟠 Long Queue | 🔴 Empty
5. (Optional) Add wait time for queue status
6. Tap **Submit**

**Expected Behavior:**
- ✅ Station marker color updates immediately
- ✅ Confidence score increases (or decreases based on report type)
- ✅ Report appears in station detail view
- ✅ Nearby users (if push enabled) receive update

**Report Format:**
```
Station: [Name]
Status Reported: [🟢/🟡/🟠/🔴]
Wait Time: [X minutes / N/A]
Photo: [Yes/No]
Result: [PASS/FAIL]
Notes: [Any issues]
```

---

### Scenario 2: Verify Station Status

**Goal:** Check that a station's reported status matches reality.

**Steps:**
1. Find a station showing 🟢 Available on the map
2. Navigate to that station physically
3. Compare actual fuel availability to the app's status

**Expected Behavior:**
- ✅ Station status accurately reflects reality ≥80% of the time
- ✅ Confidence meter shows how reliable the data is
- ✅ "Unknown" status shows for unvisited stations

**Report Format:**
```
Station: [Name]
App Status: [Status]
Actual Status: [What you found]
Accuracy: [ACCURATE/INACCORRECT]
Confidence at time: [X%]
Notes: [Details]
```

---

### Scenario 3: Use the Ration Tracker

**Goal:** Test personal fuel ration tracking across your vehicles.

**Steps:**
1. Go to **Ration** tab
2. Add a vehicle (Motorcycle / Sedan / SUV / Commercial)
3. Log a fuel-up with amount
4. Check that daily totals update correctly
5. Verify midnight reset behavior

**Expected Behavior:**
- ✅ Ration gauge fills as you approach daily limit
- ✅ Per-station limits are enforced
- ✅ Visited stations show ⚫ marker
- ✅ Midnight reset clears daily counters
- ✅ Motorcycle cannot revisit same station within 24h

**Report Format:**
```
Vehicle: [Type]
Daily Limit: [X]L
Per-Station Limit: [X]L
Action Tested: [Log fuel / Add vehicle / Midnight reset]
Expected: [What should happen]
Actual: [What happened]
Result: [PASS/FAIL]
```

---

### Scenario 4: Test AI Route Planner

**Goal:** Generate an AI-optimized fuel route and evaluate the recommendations.

**Steps:**
1. Go to **Route** tab
2. Make sure you have some remaining daily ration
3. Tap **"Find Best Route"**
4. Review the generated route
5. (Optional) Follow the route and report accuracy

**Expected Behavior:**
- ✅ Route excludes already-visited stations
- ✅ Route prioritizes high-confidence stations
- ✅ AI reasoning explains why each stop was chosen
- ✅ Total distance and ETA are shown
- ✅ Route updates if a station becomes unavailable

**Report Format:**
```
Stops Generated: [X]
Total Distance: [X]km
Total Duration: [X]min
AI Reasoning: [Readable summary]
Stations Visited: [List]
Accuracy of Predictions: [ACCURATE/INACCORRECT per station]
Result: [PASS/FAIL]
```

---

### Scenario 5: Chat with AI Assistant

**Goal:** Use the in-app AI assistant to get fuel insights.

**Steps:**
1. On the **Map** tab, tap the 💬 icon (top right)
2. Ask a question like:
   - "Where can I find fuel near Gulshan?"
   - "What's the best time to get fuel?"
   - "Which stations have the shortest queues?"
3. Evaluate the response

**Expected Behavior:**
- ✅ AI responds with relevant, localized answers
- ✅ Responses reference real station data
- ✅ Chat panel opens and closes smoothly

**Report Format:**
```
Question Asked: [Question]
Response Quality: [1-5]
Relevance: [Relevant/Somewhat/Irrelevant]
Factual Accuracy: [Correct/Incorrect/Partially]
Result: [PASS/FAIL]
```

---

## 🐛 Bug Report Template

```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
[What should happen]

## Actual Behavior
[What happens instead]

## Environment
- Device: [Phone model]
- OS: [Android version]
- App Version: [Check in Profile → Settings]
- Network: [4G/WiFi/etc.]

## Screenshots/Video
[Attach if available]

## Severity
- [ ] Critical — App crashes / data loss
- [ ] High — Feature completely broken
- [ ] Medium — Feature works but has issues
- [ ] Low — Minor UI/UX issue

## Additional Context
[Any other details]
```

---

## 📊 Feature Request Template

```markdown
## Feature Description
[Clear description of the requested feature]

## Problem It Solves
[Why would this be useful?]

## Suggested Solution
[How should it work?]

## Alternatives Considered
[Any workarounds you've tried?]

## Priority
- [ ] Must Have
- [ ] Should Have
- [ ] Nice to Have
```

---

## 🎯 Confidence Tier Reference

| Tier | Score | Meaning |
|------|-------|---------|
| 🟢 **High** | 70–100 | Multiple recent confirmations, highly reliable |
| 🟡 **Medium** | 40–69 | Single report or older data, moderately reliable |
| 🟠 **Decaying** | 20–39 | Report aging, re-confirmation needed |
| 🔴 **Disputed** | 10–19 | Contradicting reports, uncertain |
| ⚫ **Expired** | 0–9 | No recent data, assumed unknown |
| ❓ **Unknown** | — | No reports yet, AI prediction only |

---

## 📱 Known Limitations (Beta)

These are known issues we're working on:

1. **Offline Mode** — Map and station data require internet; route cache for offline is in progress
2. **Queue Times** — Wait time estimates are user-reported, not measured
3. **Photo Uploads** — Currently disabled; coming in v1.0.0
4. **Push Notifications** — FCM integration pending server setup
5. **Motorcycle Ration** — 24h cooldown between visits per station is enforced server-side

---

## 📈 What We're Measuring

Beta helps us validate:
- Station data accuracy vs. real-world conditions
- AI prediction accuracy for "unknown" stations
- User engagement with confidence scoring
- Ration tracker adoption and error rates
- Route optimization quality vs. naive nearest-neighbor

Your anonymous usage data helps us improve Fuel Rush for all Bangladeshis.

---

## ❓ Support

- **Bug Reports:** [GitHub Issues](https://github.com/adnanizaman-star/fuel-Rush/issues)
- **Telegram Support:** [PLACEHOLDER]
- **Email:** [PLACEHOLDER]
- **Docs:** [SPEC.md](https://github.com/adnanizaman-star/fuel-Rush/blob/main/SPEC.md)

---

_Thank you for helping make Fuel Rush better for millions of Bangladeshis who depend on fuel every day._ ⛽
