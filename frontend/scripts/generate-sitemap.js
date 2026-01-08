/**
 * Sitemap Generator for RateMyProf India
 * 
 * Generates a static sitemap.xml file with all pages:
 * - Static pages (homepage, about, terms, etc.)
 * - All professor pages (fetched from API)
 * - All college pages (fetched from API)
 * 
 * Run this script during build process or manually:
 * node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = 'https://ratemyprof.me';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ratemyprof-backend.onrender.com/v1';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static pages with priority and change frequency
const STATIC_PAGES = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/about/', priority: 0.7, changefreq: 'monthly' },
  { url: '/terms/', priority: 0.5, changefreq: 'yearly' },
  { url: '/privacy/', priority: 0.5, changefreq: 'yearly' },
  { url: '/guidelines/', priority: 0.6, changefreq: 'monthly' },
  { url: '/contact/', priority: 0.6, changefreq: 'monthly' },
  { url: '/help/', priority: 0.6, changefreq: 'monthly' },
  { url: '/data-collection/', priority: 0.5, changefreq: 'yearly' },
  { url: '/copyright/', priority: 0.5, changefreq: 'yearly' },
];

/**
 * Fetch all professors from API
 */
async function fetchProfessors() {
  try {
    console.log('📚 Fetching professors from API...');
    const response = await fetch(`${API_URL}/professors?limit=200`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const professors = data.professors || [];
    
    console.log(`✅ Found ${professors.length} professors`);
    return professors;
  } catch (error) {
    console.error('❌ Failed to fetch professors:', error.message);
    return [];
  }
}

/**
 * Fetch all colleges from API
 */
async function fetchColleges() {
  try {
    console.log('🏫 Fetching colleges from API...');
    const response = await fetch(`${API_URL}/colleges?limit=200`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const colleges = data.colleges || [];
    
    console.log(`✅ Found ${colleges.length} colleges`);
    return colleges;
  } catch (error) {
    console.error('❌ Failed to fetch colleges:', error.message);
    return [];
  }
}

/**
 * Generate XML sitemap
 */
function generateSitemapXML(staticPages, professors, colleges) {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add static pages
  console.log('📄 Adding static pages...');
  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Add professor pages (higher priority for verified professors with reviews)
  console.log('👨‍🏫 Adding professor pages...');
  professors.forEach(prof => {
    const priority = prof.average_rating > 0 && prof.total_reviews > 5 ? 0.8 : 0.7;
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/professors/${prof.id}/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Add college pages
  console.log('🏛️ Adding college pages...');
  colleges.forEach(college => {
    const priority = college.total_reviews > 10 ? 0.8 : 0.7;
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}/colleges/${college.id}/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

/**
 * Save sitemap to file
 */
function saveSitemap(xml) {
  try {
    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
    console.log(`✅ Sitemap saved to: ${OUTPUT_PATH}`);
    
    // Show file size
    const stats = fs.statSync(OUTPUT_PATH);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 Sitemap size: ${fileSizeInKB} KB`);
    
    // Count URLs
    const urlCount = (xml.match(/<url>/g) || []).length;
    console.log(`🔗 Total URLs: ${urlCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save sitemap:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function generateSitemap() {
  console.log('🚀 Starting sitemap generation...');
  console.log(`📍 Site URL: ${SITE_URL}`);
  console.log(`🔌 API URL: ${API_URL}`);
  console.log('');
  
  try {
    // Fetch dynamic data
    const [professors, colleges] = await Promise.all([
      fetchProfessors(),
      fetchColleges()
    ]);
    
    // Generate XML
    console.log('');
    console.log('🔨 Generating sitemap XML...');
    const xml = generateSitemapXML(STATIC_PAGES, professors, colleges);
    
    // Save to file
    console.log('');
    const success = saveSitemap(xml);
    
    if (success) {
      console.log('');
      console.log('🎉 Sitemap generation completed successfully!');
      console.log(`📍 Sitemap URL: ${SITE_URL}/sitemap.xml`);
      console.log('');
      console.log('Next steps:');
      console.log('1. Commit and push sitemap.xml');
      console.log('2. Submit to Google Search Console');
      console.log('3. Run this script weekly to keep sitemap updated');
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
