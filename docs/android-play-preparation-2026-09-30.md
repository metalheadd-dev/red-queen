# RED QUEEN Android build preparation

This is the main RED QUEEN app, including Gaming Room. The standalone BLACKSITE game remains paused.

## Prepared source

- Package: `space.redqueen.twa`; HTTPS origin: `https://redqueen.space`.
- Trusted Web Activity retains the browser-backed main app. Native and web shortcuts open Queen, Pulse and Gaming Room.
- Android compile/target SDK 36, Android Gradle Plugin 8.10.1, Gradle 8.11.1, Build Tools 35.0.0 and JDK 17. These versions match the [AGP 8.10 compatibility matrix](https://developer.android.com/build/releases/agp-8-10-0-release-notes).
- Default version: 3.4 / version code 8. Set `RQ_ANDROID_VERSION_CODE` higher than the last uploaded Play version if needed; `RQ_ANDROID_VERSION_NAME` can override the display version.
- Release lint is enabled. Signing reads environment variables rather than embedding passwords or regenerating a key.
- Queen has in-app content reporting in both main and gaming conversations, with a private admin queue. Live reporting requires the prepared migration and the verified RED QUEEN Supabase configuration. Google Play's [AI content policy](https://support.google.com/googleplay/android-developer/answer/13985936) requires working in-app reporting.

## Run locally

From the `red-queen-work` directory, in a regular PowerShell terminal:

```powershell
.\redqueen-mobile\build-android.ps1 -CheckOnly
.\redqueen-mobile\build-android.ps1
```

The script discovers the checksum-verified portable Temurin 17 downloaded under `.tools/temurin17-20260930/unpacked/`; it also accepts `-JavaHome` and `-SdkRoot`. It uses a project-local Gradle cache. No global Java installation or persistent system setting is required. The tools folder and keystores are ignored by Git.

For signing, supply all four variables through your local environment: `RQ_ANDROID_KEYSTORE`, `RQ_ANDROID_KEY_ALIAS`, `RQ_ANDROID_STORE_PASSWORD`, `RQ_ANDROID_KEY_PASSWORD`. Then run `build-android.ps1 -Signed`. Do not put passwords in this document or in a committed file. `-Signed -CheckOnly` checks prerequisites without building. Existing keys are preserved.

Successful output is `redqueen-mobile/app/build/outputs/bundle/release/app-release.aab`. An unsigned build is a review artifact; a signed build still needs Play Console validation and device testing. No build or script publishes the app.

## Actual verification status

The mobile UI now has its own compact task layout, persistent five-tab navigation, direct Queen entry, collapsed optional settings and a catalog-first Gaming Room. The current UI build and responsive checks are recorded in [Mobile app interface](mobile-app-ux-2026-09-30.md). This interface update does not resolve the Android build blocker below.

Web production build, TypeScript and 19 gaming/Steam tests passed. A 390px browser viewport had no horizontal overflow; the gaming draft and session preferences survived refresh. With the AI unconfigured, the UI retained the draft and offered retry instead of inventing a reply.

JDK 17 was downloaded from official Adoptium metadata and verified against SHA-256 `e53a79c3c3d86865bd7e787903884331068e71321714ffd44f145785affc7cb0`. Android SDK 36 and Build Tools 35.0.0 were found; prerequisite checks passed. Gradle was downloaded successfully, but Android compilation and lint could not start: Java NIO failed with `Unable to establish loopback connection`, caused by `UnixDomainSockets.connect0: Invalid argument: connect`. Approved execution outside the filesystem sandbox and an IPv4 retry produced the same failure. No new AAB is confirmed. Run the command above in an ordinary PowerShell terminal and retain its output for the next verification step.

Live Steam login, live model output, account persistence and the moderation queue were not exercised against a production RED QUEEN backend. The user explicitly chose to skip live Supabase setup. No remote database was changed, and no existing APK, signing key or Digital Asset Links fingerprint was replaced.

## Before Play upload

The existing Digital Asset Links fingerprint must be compared with the **Play App Signing** certificate, not assumed to be the upload-key certificate. Add the verified Play certificate while retaining valid existing fingerprints, then test production deep links and Steam sign-in return on a device. See [Trusted Web Activity verification](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs).

The current main app includes crypto-funded digital intelligence reports. A TWA does not exempt digital purchases from [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en); decide and implement the eligible billing/distribution path before submitting this app. Steam game discounts and crypto checkout have not been enabled by this gaming feature. Account deletion, Data Safety declarations, a working report queue and physical-device testing remain release checks. A successful AAB alone is not a claim that the app is ready for publication.
