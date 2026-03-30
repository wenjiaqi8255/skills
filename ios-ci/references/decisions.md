# iOS CI Decision Rationale

This document explains the key decisions in the iOS CI workflow and why each choice was made.

## Simulator Destination

### Rule
Don't hardcode the OS version. Auto-detect with `xcrun simctl list`.

### Rationale
- **Why not hardcode**: iOS Simulator versions change frequently. `platform=iOS Simulator,name=iPhone 15 Pro,OS=latest` can fail when GitHub Actions updates their runner images.
- **Auto-detect approach**: `xcrun simctl list devices available | grep -o 'iPhone [0-9]* Pro* Max*' | head -1` finds the best available simulator dynamically.
- **Device choice**: iPhone Pro Max variants typically have the most complete feature set for testing.

## Xcode Version Selection

### Rule
Match the scheme's `LastUpgradeVersion` in `.xcscheme`.

### Rationale
- **Consistency**: Using the same Xcode version the project was last upgraded to ensures build compatibility.
- **Finding the version**: Check `*.xcodeproj/xcshareddata/xcschemes/*.xcscheme` for `LastUpgradeVersion`.
- **Available versions on runners**: Check with `ls /Applications/ | grep Xcode` to see what's installed.

## CODE_SIGNING_ALLOWED=NO

### Rule
Always set `CODE_SIGNING_ALLOWED=NO` for test-only CI, even if there are no entitlements issues.

### Rationale
- **Eliminates signing complexity**: Test targets don't need code signing to run in the simulator.
- **Prevents CI failures**: Avoids issues with missing certificates, provisioning profiles, or expired credentials.
- **No side effects**: Tests run identically without signing for simulator destinations.
- **Best practice**: Even if your project doesn't use entitlements, this prevents future issues if they're added.

## -skipPackagePluginValidation

### Rule
Always include `-skipPackagePluginValidation` when using SPM packages.

### Rationale
- **Plugin signing issues**: Swift Package plugins require valid signatures that may not be available in CI.
- **Common failure**: Without this flag, xcodebuild fails with cryptic plugin validation errors.
- **No security concern**: In CI, we're not distributing the built product, so plugin validation is unnecessary.
- **Safe for all projects**: Even if you don't use plugins, this flag has no negative effect.

## Gitignored Files Handling

### Rule
Check `.gitignore` for `*.entitlements`, `*.storekit`, and `Info.plist` - create stubs in CI.

### Rationale
- **Security practice**: Developers often gitignore sensitive files like entitlements and StoreKit configurations.
- **Build requirements**: Xcode expects these files to exist even for test builds.
- **Stub approach**: Empty/minimal stubs allow the build to proceed without the actual sensitive content.
- **When to create stubs**:
  - `*.entitlements` → Empty plist dict (sufficient for non-signing builds)
  - `*.storekit` → Minimal StoreKit configuration JSON
  - `Info.plist` → Basic plist with version keys

## Concurrency Configuration

### Rule
Use `group: ci-${{ github.ref }}` + `cancel-in-progress: true`.

### Rationale
- **Save CI minutes**: New pushes to the same branch cancel in-progress runs.
- **Grouping**: Using `github.ref` ensures each branch has its own concurrency group.
- **Trade-off**: You lose parallel runs on the same branch, but save significant CI costs.
- **Best for**: Projects with frequent commits where older runs become irrelevant quickly.

## SPM Caching Strategy

### Rule
Key on `Package.resolved` hash with prefix fallback for restore.

### Rationale
- **Cache key structure**:
  ```yaml
  key: ${{ runner.os }}-spm-${{ hashFiles('Package.resolved') }}
  restore-keys: ${{ runner.os }}-spm-
  ```
- **Why hash**: Only invalidate cache when dependencies actually change.
- **Prefix fallback**: If exact match fails, use any available SPM cache as a starting point.
- **Cache paths**:
  - `~/Library/Developer/Xcode/DerivedData/**/SourcePackages` - Built packages
  - `SourcePackages/checkouts` - Cloned package sources

## xcpretty Usage

### Rule
Pipe through `xcpretty` for colored output + JUnit report, but keep raw `build.log` for debugging.

### Rationale
- **Why xcpretty**: Raw xcodebuild output is extremely verbose (thousands of lines).
- **Benefits**:
  - Colored, readable output in CI logs
  - JUnit XML report for test result aggregation
  - Significantly reduced log size
- **Keep raw log**: xcpretty hides detailed error information. The raw `build.log` is essential for debugging.
- **Pattern**:
  ```bash
  xcodebuild test ... 2>&1 | tee build.log | xcpretty --color --report junit --output build-report.junit
  ```
- **set -o pipefail**: Ensures the pipeline fails if xcodebuild fails, not just if tee fails.

## Simulator Selection

### Rule
Use the latest available iPhone Pro Max variant.

### Rationale
- **Consistency**: Pro Max devices have all features, avoiding "feature not available" errors.
- **Performance**: Larger devices have more resources, running tests faster.
- **Compatibility**: iPhone [0-9]* Pro* Max* regex matches the most common test targets.
- **Availability**: GitHub Actions macOS runners always have recent iPhone simulators.

## Timeout Configuration

### Rule
Set `timeout-minutes: 30` for the job.

### Rationale
- **Safety net**: Prevents runaway builds from consuming unlimited CI minutes.
- **Typical duration**: Most iOS test suites complete in 5-15 minutes.
- **Headroom**: 30 minutes allows for:
  - First-time cache miss (slower)
  - Large test suites
  - Slower GitHub Actions runners
- **Adjust if needed**: Increase for very large projects; decrease for fast test suites.
