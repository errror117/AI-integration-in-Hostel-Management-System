/**
 * Data Reconciliation Script for Organizations
 * 
 * Purpose: Read-only analysis to identify discrepancies between:
 * - Organizations in DB
 * - Organizations returned by API
 * - Organizations shown in UI
 * 
 * This script does NOT modify any data - it only generates a report.
 * Run: node utils/reconcile_organizations.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');

async function reconcileOrganizations() {
    console.log('\n🔍 ORGANIZATION RECONCILIATION REPORT');
    console.log('=====================================\n');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('Mode: READ-ONLY (no modifications)\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Get all organizations from DB
        const allOrgs = await Organization.find().lean();
        console.log(`📊 Total Organizations in DB: ${allOrgs.length}`);

        // 2. Analyze by subscription status
        const statusBreakdown = {
            active: allOrgs.filter(o => o.subscription?.status === 'active').length,
            trial: allOrgs.filter(o => o.subscription?.status === 'trial').length,
            suspended: allOrgs.filter(o => o.subscription?.status === 'suspended').length,
            cancelled: allOrgs.filter(o => o.subscription?.status === 'cancelled').length,
            expired: allOrgs.filter(o => o.subscription?.status === 'expired').length,
            unknown: allOrgs.filter(o => !o.subscription?.status).length
        };

        console.log('\n📈 Status Breakdown:');
        Object.entries(statusBreakdown).forEach(([status, count]) => {
            if (count > 0) console.log(`   - ${status}: ${count}`);
        });

        // 3. Check for potential visibility issues
        console.log('\n🔎 Visibility Analysis:');

        const issues = [];

        // Check for organizations with missing required fields
        const missingName = allOrgs.filter(o => !o.name);
        const missingSlug = allOrgs.filter(o => !o.slug);
        const missingContact = allOrgs.filter(o => !o.contact?.email);

        if (missingName.length > 0) {
            issues.push({ type: 'MISSING_NAME', count: missingName.length, orgs: missingName.map(o => o._id) });
            console.log(`   ⚠️ Organizations without name: ${missingName.length}`);
        }

        if (missingSlug.length > 0) {
            issues.push({ type: 'MISSING_SLUG', count: missingSlug.length, orgs: missingSlug.map(o => o._id) });
            console.log(`   ⚠️ Organizations without slug: ${missingSlug.length}`);
        }

        if (missingContact.length > 0) {
            issues.push({ type: 'MISSING_CONTACT', count: missingContact.length, orgs: missingContact.map(o => o._id) });
            console.log(`   ⚠️ Organizations without contact email: ${missingContact.length}`);
        }

        // 4. Check for duplicate slugs
        const slugCounts = {};
        allOrgs.forEach(o => {
            if (o.slug) {
                slugCounts[o.slug] = (slugCounts[o.slug] || 0) + 1;
            }
        });
        const duplicateSlugs = Object.entries(slugCounts).filter(([_, count]) => count > 1);
        if (duplicateSlugs.length > 0) {
            console.log(`   ⚠️ Duplicate slugs found: ${duplicateSlugs.map(([slug, count]) => `${slug}(${count})`).join(', ')}`);
            issues.push({ type: 'DUPLICATE_SLUGS', duplicates: duplicateSlugs });
        }

        // 5. Check for organizations without any users
        console.log('\n👥 User Association Analysis:');
        const orgsWithoutUsers = [];
        for (const org of allOrgs) {
            const userCount = await User.countDocuments({ organizationId: org._id });
            if (userCount === 0) {
                orgsWithoutUsers.push({ id: org._id, name: org.name, slug: org.slug });
            }
        }

        if (orgsWithoutUsers.length > 0) {
            console.log(`   ⚠️ Organizations without any users: ${orgsWithoutUsers.length}`);
            orgsWithoutUsers.forEach(o => console.log(`      - ${o.name} (${o.slug})`));
            issues.push({ type: 'NO_USERS', count: orgsWithoutUsers.length, orgs: orgsWithoutUsers });
        } else {
            console.log('   ✅ All organizations have at least one user');
        }

        // 6. List all organizations
        console.log('\n📋 Complete Organization List:');
        console.log('─'.repeat(80));
        console.log('| # | Name                                 | Slug            | Plan         | Status     |');
        console.log('─'.repeat(80));

        allOrgs.forEach((org, idx) => {
            const name = (org.name || 'N/A').substring(0, 36).padEnd(36);
            const slug = (org.slug || 'N/A').substring(0, 15).padEnd(15);
            const plan = (org.subscription?.plan || 'N/A').substring(0, 12).padEnd(12);
            const status = (org.subscription?.status || 'N/A').substring(0, 10).padEnd(10);
            console.log(`| ${String(idx + 1).padStart(1)} | ${name} | ${slug} | ${plan} | ${status} |`);
        });
        console.log('─'.repeat(80));

        // 7. Generate recommendations
        console.log('\n📝 Recommendations:');
        if (issues.length === 0) {
            console.log('   ✅ No critical issues found. All organizations appear valid.');
        } else {
            issues.forEach(issue => {
                switch (issue.type) {
                    case 'MISSING_NAME':
                        console.log(`   🔧 Add names to ${issue.count} organizations that are missing them.`);
                        break;
                    case 'MISSING_SLUG':
                        console.log(`   🔧 Generate slugs for ${issue.count} organizations.`);
                        break;
                    case 'DUPLICATE_SLUGS':
                        console.log(`   🔧 Resolve duplicate slugs: ${issue.duplicates.map(d => d[0]).join(', ')}`);
                        break;
                    case 'NO_USERS':
                        console.log(`   🔧 Consider removing or assigning users to ${issue.count} empty organizations.`);
                        break;
                }
            });
        }

        // 8. Save report to file
        const report = {
            timestamp: new Date().toISOString(),
            mode: 'READ_ONLY',
            summary: {
                totalOrganizations: allOrgs.length,
                statusBreakdown,
                issuesFound: issues.length
            },
            organizations: allOrgs.map(o => ({
                id: o._id,
                name: o.name,
                slug: o.slug,
                plan: o.subscription?.plan,
                status: o.subscription?.status,
                createdAt: o.createdAt
            })),
            issues,
            recommendations: issues.map(i => i.type)
        };

        const fs = require('fs');
        fs.writeFileSync('../audit-results/reconcile_report.json', JSON.stringify(report, null, 2));
        console.log('\n✅ Report saved to: audit-results/reconcile_report.json');

        console.log('\n=====================================');
        console.log('RECONCILIATION COMPLETE');
        console.log('=====================================\n');

    } catch (error) {
        console.error('❌ Error during reconciliation:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

reconcileOrganizations();
