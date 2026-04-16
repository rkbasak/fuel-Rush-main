# Fuel Rush — Play Store Preparation

## Overview
This document outlines the steps required to publish the Fuel Rush Android app on the Google Play Store.

---

## 1. App Signing Key Instructions

### Generating a Keystore (First Time)
```bash
keytool -genkey -v -keystore fuel-rush-release.keystore \
  -alias fuel-rush -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Fuel Rush Team, OU=Fuel Rush, O=Fuel Rush, L=Dhaka, ST=Bangladesh, C=BD"
```

### Building a Release APK
```bash
# Set environment variables
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk

# Build release APK
cd android
./gradlew assembleRelease

# The APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Signing with an Existing Keystore
```bash
# If you already have a keystore
jarsigner -verbose -sigalg SHA1withRSA \
  -digestalg SHA1 \
  -keystore fuel-rush-release.keystore \
  app-release.apk fuel-rush

# Verify the signature
jarsigner -verify -verbose -certs app-release.apk
```

### Converting to Play Store Format
```bash
# Align the APK (required by Play Store)
zipalign -v 4 app-release.apk app-release-aligned.apk

# The final APK for upload is: app-release-aligned.apk
```

---

## 2. Store Listing Copy

### English (Primary)
**App Name:** Fuel Rush — Bangladesh Fuel Intelligence
**Tagline:** Real-time fuel availability in Bangladesh

**Short Description (80 chars):**
AI-powered fuel station tracker for Bangladesh drivers

**Full Description:**
Fuel Rush is Bangladesh's smartest fuel companion. Find available fuel stations near you, track your daily ration, plan efficient routes, and contribute to community-verified fuel data.

Features:
• Real-time map of fuel stations with live availability status
• AI-powered predictions for when stations get fuel
• Smart daily ration tracking with midnight resets
• Route optimization to save fuel and time
• Crowdsourced reports with trust scoring
• Push notifications when nearby stations get fuel
• Dark theme optimized for night driving

Whether you're a car, motorcycle, or CNG driver, Fuel Rush helps you find fuel faster and waste less time waiting in queue.

**Category:** Maps & Navigation
**Content Rating:** Everyone
**Price:** Free

### Bangla (বাংলা)
**App Name:** Fuel Rush — বাংলাদেশ জ্বালানি বুদ্ধিমত্তা

**Short Description (80 chars):**
বাংলাদেশে রিয়েল-টাইম জ্বালানি স্টেশন ট্র্যাকার

**Full Description:**
ফুয়েল রাশ বাংলাদেশের স্মার্টেস্ট জ্বালানি সঙ্গী। আপনার কাছের উপলব্ধ জ্বালানি স্টেশন খুঁজুন, আপনার দৈনিক রেশন ট্র্যাক করুন, কার্যকরী রুট পরিকল্পনা করুন এবং কমিউনিটি-ভেরিফাইড জ্বালানি ডেটাতে অবদান রাখুন।

বৈশিষ্ট্য:
• লাইভ প্রাপ্যতা স্থিতি সহ জ্বালানি স্টেশনগুলির রিয়েল-টাইম মানচিত্র
• কৃত্রিম বুদ্ধিমত্তা-চালিত ভবিষ্যদ্বাণী
• মধ্যরাত রিসেট সহ স্মার্ট দৈনিক রেশন ট্র্যাকিং
• জ্বালানি এবং সময় বাঁচাতে রুট অপ্টিমাইজেশন
• ট্রাস্ট স্কোরিং সহ ক্রাউডসোর্সড রিপোর্ট
• কাছাকাছি স্টেশনগুলি জ্বালানি পেলে পুশ নোটিফিকেশন

---

## 3. Screenshots Requirements

### Phone Screenshots (Required)
- **Resolution:** 1080 x 1920 pixels (or any 9:16 aspect ratio)
- **Format:** PNG or JPEG
- **Minimum:** 2 screenshots
- **Recommended:** 8 screenshots

**Suggested screenshots:**
1. Map view showing nearby fuel stations with color-coded status
2. Station detail sheet with real-time availability
3. Daily ration tracker with progress bar
4. AI route optimizer with waypoints
5. Notification showing nearby fuel alert
6. Station report submission flow
7. Trust score / profile page
8. Registration / onboarding flow

### Feature Graphic
- **Resolution:** 1024 x 500 pixels
- **Format:** PNG or JPEG
- Must not include device frame

### App Icon
- **Resolution:** 512 x 512 pixels
- Must not contain any offensive content
- Square, no rounded corners (Play Store adds them)

---

## 4. Privacy Policy URL Template

Your privacy policy must be hosted at a publicly accessible URL. Here's a template:

```
Privacy Policy for Fuel Rush

Last updated: [DATE]

Fuel Rush ("we", "our", or "us") operates the Fuel Rush mobile application.

Information We Collect:
1. Location Data: We collect your location to find nearby fuel stations and provide proximity-based alerts. Location is only accessed when the app is in use or background location tracking is enabled with your consent.

2. Vehicle Information: We store your registered vehicle type and daily fuel ration preferences.

3. Usage Data: We collect anonymized usage statistics to improve the app.

How We Use Your Information:
- To provide real-time fuel station information
- To send proximity-based fuel alerts
- To track your daily ration consumption
- To improve our AI prediction models

Data Storage:
All personal data is stored securely in Supabase (our backend provider) and Firebase.

Third-Party Services:
- Supabase (database and authentication)
- Firebase Cloud Messaging (push notifications)
- OpenStreetMap / Mapbox (mapping)

Your Rights:
You can request deletion of your account and personal data at any time by contacting us.

Contact Us:
Email: support@fuelrush.app
Website: https://fuelrush.app/privacy
```

---

## 5. ARM64 + AMD64 Dual-Architecture Builds

### Supported Architectures

Fuel Rush APKs are built for **both ARM64 and AMD64** devices:
- `arm64-v8a` — ARM64 devices (Apple Silicon Macs via CI, most modern Android phones/tablets, AWS Graviton, Oracle Ampere)
- `x86_64` — AMD64 devices (Intel/AMD desktops/laptops, older Android emulators, CI runners)

This is configured in `android/app/build.gradle` via `ndk.abiFilters`:
```groovy
ndk {
    abiFilters 'arm64-v8a', 'x86_64'
}
```

### No Native Code in the APK

The Fuel Rush APK is a **Capacitor-wrapped web app** — it contains HTML, CSS, and JavaScript that runs in a WebView on the Android device. The build produces no native Android code beyond the Capacitor runtime shell.

**Node.js dependencies (build-time only):**
- Some dev dependencies (`@next/swc`, `@tailwindcss/oxide`, `sharp`) ship pre-built `.node` binaries for the build machine's architecture (ARM64 in your case)
- These are **never bundled into the APK** — they only run during the CI build process
- The APK itself contains only web assets (JS, CSS, images, HTML)

**Capacitor plugins (runtime):**
- `@capacitor/geolocation`, `@capacitor/haptics`, `@capacitor/local-notifications` — these are pure JS wrappers that call Android system APIs via the Capacitor bridge
- They contain no native code that needs `ndk.abiFilters`
- The `ndk.abiFilters 'arm64-v8a', 'x86_64'` setting in `build.gradle` is configured for future-proofing if any native-code Capacitor plugins are added

**Conclusion:** No native code issues affect the APK's architecture compatibility. The APK runs on both ARM64 and AMD64 Android devices.

### Why Use CI to Build APKs

AAPT2 (Android Asset Packaging Tool 2), a required component of the Android build toolchain, **only ships as an x86_64 binary**. It does not have an official ARM64 build.

This means:
- **Local builds fail on ARM64 machines** — Apple Silicon Macs, ARM servers (Oracle Ampere, AWS Graviton, Raspberry Pi)
- The error is typically: `Could not execute aapt2 ... Exec format error` or similar
- x86_64 machines build fine locally (including Intel Macs and x86_64 Linux)

### The Solution: Build APKs via GitHub Actions CI

**Fuel Rush uses GitHub Actions to build all APKs.** The CI runner (`ubuntu-latest`) is x86_64, so AAPT2 works correctly without any emulation or workaround.

**How it works:**
- Every push to `main` triggers the `Build Android APK` workflow automatically
- The workflow builds the Next.js app, syncs Capacitor, and runs `gradlew assembleDebug`
- The resulting APK is uploaded as a workflow artifact

**To trigger a build manually:**
1. Go to the repository's **Actions** tab on GitHub
2. Select the **Build Android APK** workflow
3. Click **Run workflow** (green button)
4. Choose `debug` (default) or `release` as the build type
5. Wait ~5-10 minutes for the build to complete

**To download the APK:**
1. Go to the repository's **Actions** tab on GitHub
2. Select the **Build Android APK** workflow
3. Click on the latest successful run
4. In the "Artifacts" section, click **fuel-rush-debug-apk** (or **fuel-rush-release-apk** for release builds)
5. The APK will download as a zip — extract to get the `.apk` file

**To build a release APK for Play Store:**
1. Run the workflow with `build_type: release`
2. Download `fuel-rush-release-apk`
3. Sign with your keystore: `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore fuel-rush-release.keystore app-release.apk fuel-rush`
4. Align: `zipalign -v 4 app-release.apk app-release-aligned.apk`
5. Upload `app-release-aligned.apk` to Google Play Console

**Why not try to fix AAPT2 for ARM64?**
- Google's official AAPT2 binaries do not have ARM64 builds
- Community ARM64 ports exist but are unofficial and may have subtle bugs
- Cross-compilation from x86_64 to ARM64 requires a complex toolchain setup
- CI is the simplest, most reliable, and most secure approach

**For local development on ARM64 (optional workaround):**
If you must build locally on ARM64 for rapid iteration, use a Docker container with an x86_64 JDK:
```bash
docker run --rm -v $(pwd):/app -w /app \
  -e ANDROID_HOME=/opt/android/cmdline-tools/latest \
  -e JAVA_HOME=/opt/java/openjdk \
  eclipse-temurin:21-jdk \
  sh -c "apt-get update && apt-get install -y wget unzip && \
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
  mkdir -p /opt/android/cmdline-tools && \
  unzip -q commandlinetools-linux-11076708_latest.zip -d /opt/android/cmdline-tools && \
  mv /opt/android/cmdline-tools/cmdline-tools /opt/android/cmdline-tools/latest && \
  export PATH=\$PATH:\$ANDROID_HOME/tools:\$ANDROID_HOME/tools/bin && \
  yes | sdkmanager --licenses && \
  sdkmanager 'platform-tools' 'platforms;android-34' && \
  ./gradlew assembleDebug"
```

**No PAT is required** to download artifacts from public repository workflows.

---

## 6. Release Checklist

- [ ] Set up Google Play Developer account ($25 one-time fee)
- [ ] Create app in Google Play Console
- [ ] Verify APK targets both `arm64-v8a` and `x86_64` (see `android/app/build.gradle` → `ndk.abiFilters`)
- [ ] Upload signed APK (or AAB for Play Store)
- [ ] Fill in store listing (English + Bangla)
- [ ] Add screenshots (8 recommended)
- [ ] Create privacy policy and host at URL
- [ ] Add privacy policy URL in Play Console
- [ ] Set up content rating (questionnaire)
- [ ] Configure pricing (free or paid)
- [ ] Set up distribution (countries)
- [ ] Create release with release notes
- [ ] Submit for review (typically 1-3 days)
