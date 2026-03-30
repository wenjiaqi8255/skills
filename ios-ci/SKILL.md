---
name: ios-ci
description: This skill should be used when the user asks to "set up CI for my iOS app", "add GitHub Actions to my Swift project", "create a test workflow for Xcode", "automate iOS testing", "fix iOS CI pipeline issues", or mentions iOS/SwiftUI continuous integration. Creates test workflows with SPM caching, handles gitignored entitlements/storekit/Info.plist files, and verifies the pipeline works.
---

# iOS CI Workflow Setup

Quickly set up a GitHub Actions CI pipeline for any iOS/SwiftUI project that runs tests on every push and PR.

## When to Use

- Setting up CI for a new or existing iOS project
- Adding test automation to an iOS project with no CI
- Migrating from manual deployment scripts to automated CI

## Prerequisites

- iOS project with at least one test target
- GitHub repository
- No special secrets required if tests are self-contained (mocked)

## Workflow

### Step 1: Gather Project Info

Read these files to understand the project:

1. **Xcode project config** - Find the scheme name, targets, bundle ID, and deployment target:
   ```
   grep -E '(name|productName|PRODUCT_BUNDLE_IDENTIFIER|IPHONEOS_DEPLOYMENT_TARGET)' *.xcodeproj/project.pbxproj
   ```
   Look for shared schemes in `*.xcodeproj/xcshareddata/xcschemes/`

2. **Dependency management** - Check for SPM (Package.resolved), CocoaPods (Podfile), or Carthage (Cartfile)

3. **Gitignored files** - Check `.gitignore` for `*.entitlements`, `*.storekit`, `Info.plist` that CI won't have

4. **Existing deployment** - Look for Fastfile, Gemfile, or shell scripts

### Step 2: Create the Workflow

Create `.github/workflows/ci.yml` using the template in `examples/basic-ci.yml`.

Replace placeholders `<...>` with actual project values.

See `examples/basic-ci.yml` for a complete, ready-to-use workflow.

### Step 3: Apply Key Decisions

| Decision | Rule |
|----------|------|
| **Simulator destination** | Don't hardcode OS version - auto-detect with `xcrun simctl list` |
| **Xcode version** | Match the scheme's `LastUpgradeVersion` in `.xcscheme` |
| **CODE_SIGNING_ALLOWED=NO** | Always set for test-only CI, even without entitlements issues |
| **-skipPackagePluginValidation** | Avoids plugin signing issues with SPM packages |
| **Gitignored files** | Check `.gitignore` - create stubs for `*.entitlements`, `*.storekit`, `Info.plist` |
| **Concurrency** | Use `group: ci-${{ github.ref }}` + `cancel-in-progress: true` |
| **SPM cache** | Key on `Package.resolved` hash, restore with prefix fallback |
| **xcpretty** | Pipe through for colored output + JUnit report; keep raw `build.log` |

For detailed decision rationale, see `references/decisions.md`.

### Step 4: Verify

1. Commit and push the workflow
2. Check CI runs: `gh run list --limit 1`
3. If it fails, download build log: `gh run download <id> -n build-log -D /tmp/ci-log`

For common errors and solutions, see `references/troubleshooting.md`.

### Step 5: Iterate on Test Failures

If tests fail (build passes but tests fail):

1. Download `test-results` artifact and inspect with `xcrun xcresulttool`
2. See `references/troubleshooting.md` for common iOS test issues

## Output

After completion, the project should have:
- `.github/workflows/ci.yml` — working CI workflow
- Green CI check on push/PR
- Test results and build logs as downloadable artifacts

## Additional Resources

### Examples

- **`examples/basic-ci.yml`** - Complete, ready-to-use GitHub Actions workflow template

### References

- **`references/decisions.md`** - Detailed rationale for key CI configuration decisions
- **`references/troubleshooting.md`** - Common errors and solutions for iOS CI pipelines
