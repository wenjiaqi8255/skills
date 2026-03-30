# iOS CI Troubleshooting Guide

Common errors and solutions for iOS CI pipelines.

## Build Errors

### "Unable to find a device matching destination"

**Cause**: Hardcoded simulator OS version that doesn't exist on the runner.

**Solutions**:
1. Remove hardcoded OS version from `-destination`
2. Use auto-detect: `DEST="$(xcrun simctl list devices available | grep -o 'iPhone [0-9]* Pro* Max*' | head -1)"`
3. Verify simulator availability: `xcrun simctl list devices available`

### "Build input file cannot be found: .../Info.plist"

**Cause**: Info.plist is gitignored or expected by the build system.

**Solutions**:
1. Check if Info.plist is in `.gitignore`
2. Create stub Info.plist in the "Create gitignored files" step:
   ```bash
   cat > <path>/Info.plist << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>CFBundleVersion</key>
     <string>1</string>
     <key>CFBundleShortVersionString</key>
     <string>1.0</string>
   </dict>
   </plist>
   EOF
   ```

### "Build input file cannot be found: .../*.storekit"

**Cause**: StoreKit configuration file is gitignored.

**Solutions**:
1. Check if `*.storekit` is in `.gitignore`
2. Create stub .storekit file:
   ```bash
   cat > <path>/<filename>.storekit << 'EOF'
   {
     "identifier" : "<bundle-id>.storekit",
     "nonRenewableSubscriptions" : [],
     "products" : [],
     "subscriptionGroups" : [],
     "version" : {"major" : 3, "minor" : 0}
   }
   EOF
   ```

### "Build input file cannot be found: .../*.entitlements"

**Cause**: Entitlements file is gitignored.

**Solutions**:
1. Check if `*.entitlements` is in `.gitignore`
2. Create stub entitlements file:
   ```bash
   cat > <path>/<filename>.entitlements << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict/>
   </plist>
   EOF
   ```
3. Alternative: Set `CODE_SIGNING_ALLOWED=NO` (already in the workflow)

### Exit code 70 (xcodebuild build failure)

**Cause**: Build failed, but xcpretty may filtered output.

**Solutions**:
1. Download the `build-log` artifact from GitHub Actions
2. Search for "error:" in the raw log: `grep -i "error:" build.log`
3. Check the raw log for specific compiler errors that xcpretty may have hidden

## Test Failures

### Dictionary iteration order mismatch

**Symptom**: `XCTAssertEqual` fails because dictionary order is non-deterministic.

**Solutions**:
```swift
// WRONG: Order may vary
XCTAssertEqual(result, expectedValue)

// CORRECT: Use set-based comparison
XCTAssertTrue(validSet.contains(result))

// Or sort and compare if order matters
XCTAssertEqual(result.sorted(), expectedValue.sorted())
```

### @MainActor deadlock

**Symptom**: Tests hang or timeout when using `wait(for:)` with `@MainActor`-isolated code.

**Cause**: `wait(for:)` blocks the main thread, conflicting with `@MainActor` isolation.

**Solutions**:
```swift
// WRONG: Blocks main thread
wait(for: [expectation])

// CORRECT: Use async/await
await fulfillment(of: [expectation])

// Or run on background thread
Task { @MainActor in
    expectation.fulfill()
}
```

### NLP model dependency issues

**Symptom**: Tests using `NLTagger` or `NLGazer` fail inconsistently.

**Cause**: Apple's Natural Language Processing results vary across platforms and OS versions.

**Solutions**:
```swift
// Use lenient assertions
XCTAssertTrue(confidence > 0.5)  // Instead of XCTAssertEqual

// Or skip tests in CI
#if !targetEnvironment(env: .ci)
    XCTaggingTests.testNLTagger()
#endif
```

### Stale test data

**Symptom**: Tests fail because expected values don't match actual values.

**Cause**: Demo/sample content in source changed but tests weren't updated.

**Solutions**:
1. Check if test data is hardcoded or loaded from files
2. Update expected values to match current source
3. Consider using test fixtures instead of source data

## Debugging Commands

### Inspect Test Results
```bash
# Download test-results artifact first
gh run download <run-id> -n test-results -D /tmp/results

# Inspect with xcresulttool
xcrun xcresulttool get --path /tmp/results/TestResults.xcresult
```

### Check Available Simulators
```bash
# List all available simulators
xcrun simctl list devices available

# Find specific device
xcrun simctl list devices available | grep "iPhone 15"
```

### View Build Log
```bash
# Download build log artifact
gh run download <run-id> -n build-log -D /tmp/logs

# Search for errors
grep -i "error:" /tmp/logs/build.log

# Search for specific file
grep -i "missing" /tmp/logs/build.log
```

### Check Xcode Version
```bash
# List available Xcode versions
ls /Applications/ | grep Xcode

# Check current version
xcodebuild -version
```

## Common Workflow Issues

### Workflow Not Triggering
- Check `.github/workflows/ci.yml` exists
- Verify branch names match `on: push: branches`
- Check workflow syntax: `gh workflow view ci.yml`

### Slow SPM Resolution
- Check `Package.resolved` exists
- Verify cache key matches actual path
- Consider using `SWIFTCACHE` environment variable for Xcode 16+

### Memory Issues
- Increase `timeout-minutes` if tests timeout
- Consider splitting test suite into multiple jobs
- Check for memory leaks in tests
