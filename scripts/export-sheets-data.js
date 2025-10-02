#!/usr/bin/env node

/**
 * Google Sheets Data Export Script
 * Purpose: Extract data from Google Sheets and prepare SQL for Supabase insertion
 * 
 * Usage: 
 * 1. Run this script to get data from Google Sheets
 * 2. Copy the output SQL to Supabase SQL editor
 * 3. Update the app to use Supabase instead of Google Sheets API
 */

import https from 'https';
import fs from 'fs';

// Google Sheets URLs
const ATTACK_STATUS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRODXd6UHeb_ayDrGm_G61cmHMsAZcjOPbM8yfwXQdymVxCBOomvhdTFsl3gEVnH5l6T4WUQGIamgEO/pub?output=csv';
const INCIDENTS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAE39YYmDKYFdANJMSEnb_PuqmmT2zC_WCYppFBnJZDVq-tdaVe99UgI2kjeOFhHn96Q1qwqkEvUOv/pub?output=csv';

// Helper function to fetch CSV data with redirect support
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        const request = https.request(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MigrationBot/1.0)',
                'Accept': 'text/csv',
            },
        }, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    console.log(`Following redirect to: ${redirectUrl}`);
                    fetchCSV(redirectUrl).then(resolve).catch(reject);
                    return;
                }
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => resolve(data));
        });
        
        request.on('error', reject);
        request.end();
    });
}

// Parse CSV to array of objects
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        return row;
    });
}

// Generate SQL for attack status
function generateAttackStatusSQL(data) {
    console.log('-- Attack Status Data for Supabase');
    console.log('-- Generated:', new Date().toISOString());
    console.log('');
    
    const sql = data.map(row => {
        const vesselName = row.vessel_name || row.name || '';
        const status = row.status || '';
        
        if (!vesselName || !status) return null;
        
        // Clean status values
        const cleanStatus = status.toLowerCase();
        if (!['attacked', 'emergency'].includes(cleanStatus)) return null;
        
        return `INSERT INTO public.attack_status (vessel_name, status, created_at, updated_at)\n    VALUES ('${vesselName.replace(/'/g, "''")}', '${cleanStatus}', NOW(), NOW())\n    ON CONFLICT (vessel_name) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();`;
    }).filter(Boolean);
    
    return sql.join('\n');
}

// Generate SQL for incidents
function generateIncidentsSQL(data) {
    console.log('-- Incidents Reports Data for Supabase');
    console.log('-- Generated:', new Date().toISOString());
    console.log('');
    
    const sql = data.map(row => {
        const datetime = row.datetime || '';
        const notes = row.notes_published || '';
        
        if (!datetime || !notes) return null;
        
        // Try to parse datetime
        let parsedDate;
        try {
            parsedDate = new Date(datetime).toISOString();
            if (parsedDate === 'Invalid Date') return null;
        } catch {
            return null;
        }
        
        return `INSERT INTO public.incidents_reports (datetime, notes_published, created_at, updated_at)\n    VALUES ('${parsedDate}', '${notes.replace(/'/g, "''")}', NOW(), NOW());`;
    }).filter(Boolean);
    
    // Sort by datetime descending (newest first)
    return sql.sort((a, b) => {
        const aMatch = a.match(/'([^']+)'/);
        const bMatch = b.match(/'([^']+)'/);
        if (!aMatch || !bMatch) return 0;
        return new Date(bMatch[1]) - new Date(aMatch[1]);
    }).join('\n');
}

// Main execution
async function main() {
    console.log('🚀 Starting Google Sheets to Supabase migration...\n');
    
    try {
        // Fetch attack status data
        console.log('📊 Fetching attack status data...');
        const attackStatusCSV = await fetchCSV(ATTACK_STATUS_URL);
        const attackStatusData = parseCSV(attackStatusCSV);
        console.log(`✅ Found ${attackStatusData.length} attack status records\n`);
        
        // Fetch incidents data
        console.log('📋 Fetching incidents data...');
        const incidentsCSV = await fetchCSV(INCIDENTS_URL);
        const incidentsData = parseCSV(incidentsCSV);
        console.log(`✅ Found ${incidentsData.length} incidents records\n`);
        
        // Generate SQL
        console.log('📝 Generating SQL scripts...\n');
        
        const attackStatusSQL = generateAttackStatusSQL(attackStatusData);
        const incidentsSQL = generateIncidentsSQL(incidentsData);
        
        console.log('DROP TABLE IF EXISTS public.attack_status CASCADE;');
        console.log('DROP TABLE IF EXISTS public.incidents_reports CASCADE;');
        console.log('');
        
        console.log('=' + '='.repeat(79));
        console.log('STEP 1: Run the table creation SQL first (from migrate-google-sheets-to-supabase.sql)');
        console.log('=' + '='.repeat(79));
        console.log('');
        
        console.log('=' + '='.repeat(79));
        console.log('STEP 2: Attack Status SQL');
        console.log('=' + '='.repeat(79));
        console.log(attackStatusSQL);
        console.log('');
        
        console.log('=' + '='.repeat(79));
        console.log('STEP 3: Incidents SQL');
        console.log('=' + '='.repeat(79));
        console.log(incidentsSQL);
        console.log('');
        
        console.log('=' + '='.repeat(79));
        console.log('✅ Migration data ready! Copy each section to Supabase SQL editor');
        console.log('=' + '='.repeat(79));
        
        // Save to files for easier copying
        fs.writeFileSync('migration-attack-status.sql', attackStatusSQL);
        fs.writeFileSync('migration-incidents.sql', incidentsSQL);
        
        console.log('\n📁 SQL files saved:');
        console.log('   - migration-attack-status.sql');
        console.log('   - migration-incidents.sql');
        console.log('\n🎉 Ready for Supabase migration!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
main().catch(console.error);

export { fetchCSV, generateAttackStatusSQL, generateIncidentsSQL };
