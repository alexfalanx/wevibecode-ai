// Quick diagnostic tool to check preview data in database
// Run with: node check-preview-data.js <preview-id>

const previewId = process.argv[2] || '03de5277-e2aa-4b11-af24-85cdbae2a856';

console.log(`Checking preview data for ID: ${previewId}`);
console.log(`\nTo check this preview in Supabase:`);
console.log(`1. Go to: https://app.supabase.com`);
console.log(`2. Select your project`);
console.log(`3. Go to Table Editor → previews`);
console.log(`4. Search for ID: ${previewId}`);
console.log(`\nRun this SQL query in Supabase SQL Editor:`);
console.log(`
SELECT
  id,
  title,
  LENGTH(html_content) as html_length,
  LENGTH(css_content) as css_length,
  LENGTH(js_content) as js_length,
  generation_type,
  created_at
FROM previews
WHERE id = '${previewId}';
`);

console.log(`\nIf html_length, css_length, or js_length are 0 or NULL, the data wasn't saved properly.`);
console.log(`\nCommon issues:`);
console.log(`- Generation API might have failed silently`);
console.log(`- Data might be stored in wrong format`);
console.log(`- RLS policies might be blocking the data`);
