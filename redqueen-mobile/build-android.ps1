param(
    [switch]$CheckOnly,
    [switch]$Signed,
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$SdkRoot = $env:ANDROID_SDK_ROOT
)
$ErrorActionPreference = 'Stop'
$taskAndroidRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
if (-not $JavaHome) {
    $taskPortableJava = Join-Path $taskAndroidRoot '..\.tools\temurin17-20260930\unpacked\jdk-17.0.20.1+1'
    if (Test-Path -LiteralPath (Join-Path $taskPortableJava 'bin\java.exe')) { $JavaHome = (Resolve-Path -LiteralPath $taskPortableJava).Path }
}
if (-not $SdkRoot) { $SdkRoot = $env:ANDROID_HOME }
if (-not $SdkRoot) { $SdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$taskFailures = [System.Collections.Generic.List[string]]::new()
$taskJava = if ($JavaHome) { Join-Path $JavaHome 'bin\java.exe' } else { $null }
if (-not $taskJava -or -not (Test-Path -LiteralPath $taskJava)) { $taskFailures.Add('Set JAVA_HOME to an installed JDK 17 or later.') }
else {
    $taskJavaVersion = (& $taskJava -version 2>&1 | Out-String)
    if ($taskJavaVersion -notmatch 'version "(\d+)' -or [int]$Matches[1] -lt 17) { $taskFailures.Add('JDK 17 or later is required.') }
}
if (-not (Test-Path -LiteralPath (Join-Path $SdkRoot 'platforms\android-36\android.jar'))) { $taskFailures.Add('Android SDK platform 36 is required.') }
if (-not (Test-Path -LiteralPath (Join-Path $SdkRoot 'build-tools\35.0.0'))) { $taskFailures.Add('Android Build Tools 35.0.0 are required by AGP 8.10.') }
if ($Signed) {
    foreach ($taskName in @('RQ_ANDROID_KEYSTORE', 'RQ_ANDROID_KEY_ALIAS', 'RQ_ANDROID_STORE_PASSWORD', 'RQ_ANDROID_KEY_PASSWORD')) {
        if (-not [Environment]::GetEnvironmentVariable($taskName)) { $taskFailures.Add("Missing signing variable: $taskName") }
    }
    if ($env:RQ_ANDROID_KEYSTORE -and -not (Test-Path -LiteralPath $env:RQ_ANDROID_KEYSTORE)) { $taskFailures.Add('The configured upload keystore could not be found.') }
}
if ($taskFailures.Count) { foreach ($taskFailure in $taskFailures) { Write-Output "[android:blocked] $taskFailure" }; exit 1 }
Write-Output '[android:ok] JDK, SDK and build prerequisites found.'
if ($CheckOnly) { exit 0 }
$env:JAVA_HOME = $JavaHome
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:ANDROID_HOME = $SdkRoot
$env:GRADLE_USER_HOME = Join-Path $taskAndroidRoot '.gradle-user-home'
Push-Location -LiteralPath $taskAndroidRoot
try {
    & (Join-Path $taskAndroidRoot 'gradlew.bat') --no-daemon :app:lintRelease :app:bundleRelease
    if ($LASTEXITCODE -ne 0) {
        $taskBuildExit = $LASTEXITCODE
        Write-Output '[android:failed] No successful bundle is confirmed. Existing output files are preserved.'
        Write-Output '[android:hint] If Gradle reports Unable to establish loopback connection inside Codex on Windows, run this same script in a regular PowerShell terminal.'
        exit $taskBuildExit
    }
    $taskBundle = Join-Path $taskAndroidRoot 'app\build\outputs\bundle\release\app-release.aab'
    if (-not (Test-Path -LiteralPath $taskBundle)) { throw 'The Android App Bundle was not generated.' }
    Write-Output "[android:bundle] $taskBundle"
    if (-not $Signed) { Write-Output '[android:unsigned] Verify signing separately before uploading to Play Console.' }
    Write-Output '[android:review] This build does not imply Play policy approval or authorize publication.'
} finally { Pop-Location }
