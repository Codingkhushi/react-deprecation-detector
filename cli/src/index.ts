import { detectDeprecated,Issue } from "./detector";
import { applyFixes, generateFixes } from "./fix-generator";


const targetDir = process.argv[2] || "./test/**/*.{tsx,jsx,ts,js}";
const dryRun = process.argv.includes('--dry-run');

console.log("🔍 Step 1: Detecting deprecated APIs...\n");

if (dryRun) {
    console.log("🔒 DRY RUN MODE - No files will be modified\n");
}

const issues = detectDeprecated(targetDir);

if (issues.length === 0) {
    console.log("✅ No issues found!");
    process.exit(0);
}

console.log(`\n📊 Found ${issues.length} issue(s)\n`);

// Group by category
const byCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
}, {} as Record<string, Issue[]>);

console.log("📋 Issues by Category:\n");
Object.entries(byCategory).forEach(([category, categoryIssues]) => {
    console.log(`\n📦 ${category} (${categoryIssues.length} issues):`);
    categoryIssues.forEach(issue => {
        const fileName = issue.file.split('/').pop();
        console.log(`  ⚠️  ${fileName}:${issue.line} - ${issue.api}`);
        console.log(`     ${issue.message}`);
        console.log(`     💡 ${issue.alternative}\n`);
    });
});

console.log("=".repeat(70));

console.log("\n🔧 Step 2: Generating fixes...\n");

const fixes = generateFixes(issues);

if (fixes.length === 0) {
    console.log("⚠️  No automatic fixes available for these issues.");
    console.log("All issues require manual review.\n");
    
    console.log("📊 Summary:");
    console.log(`   Total issues: ${issues.length}`);
    console.log(`   Auto-fixable: 0`);
    console.log(`   Manual review: ${issues.length}`);
    
    process.exit(0);
}

// Continue with existing fix preview and application...
const byConfidence = {
    high: fixes.filter(f => f.confidence === "high").length,
    medium: fixes.filter(f => f.confidence === "medium").length,
    low: fixes.filter(f => f.confidence === "low").length
    };

console.log("📊 Fix Statistics:");
console.log(`   High confidence: ${byConfidence.high}`);
console.log(`   Medium confidence: ${byConfidence.medium}`);
console.log(`   Low confidence: ${byConfidence.low}\n`);

console.log("📝 Preview of changes:");
console.log("=".repeat(70));

fixes.forEach(fix => {
    const confidenceEmoji = fix.confidence === "high" ? "✅" : fix.confidence === "medium" ? "⚠️" : "❌";
    const fileName = fix.file.split('/').pop();
    console.log(`\n${confidenceEmoji} ${fileName}:${fix.line} [${fix.confidence.toUpperCase()}]`);
    console.log(`   Deprecated: ${fix.api}`);
    console.log(`   Action: ${fix.type}`);
    console.log(`   Before:\n${fix.before}`);
    console.log(`   After:\n${fix.after}`);
});

console.log("\n" + "=".repeat(70));

if (dryRun) {
    console.log("\n🔒 Dry run mode - no changes applied");
} else {
    console.log("\n❓ Apply these fixes? (for now, we'll apply automatically)");
    applyFixes(fixes);
}

console.log("\n📈 Summary:");
console.log(`   Total issues: ${issues.length}`);
console.log(`   Fixes generated: ${fixes.length}`);
console.log(`   Auto-fixed: ${byConfidence.high}`);
console.log(`   Need review: ${byConfidence.medium + byConfidence.low}`);