// Test script to upload sample stock images to S3
// Run with: node test-stock-images.js

const AWS = require('aws-sdk');
require('dotenv').config();

// Configure S3 client
const s3 = new AWS.S3({
  endpoint: `https://${process.env.S3_REGION}.${process.env.S3_ENDPOINT}`,
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: process.env.S3_REGION
});

async function listStockImages() {
  console.log('\n🔍 Checking for stock images with "zzz" prefix...\n');
  
  const params = {
    Bucket: process.env.S3_BUCKET,
    Prefix: 'images/zzz-'
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    
    if (data.Contents.length === 0) {
      console.log('❌ No stock images found with "zzz" prefix');
      console.log('\nTo add stock images, upload files with names like:');
      console.log('  - zzz-default-sunset-full.png');
      console.log('  - zzz-default-sunset-small.png');
      console.log('  - zzz-default-sunset-thumb.png');
      console.log('\nThey should be in the "images/" folder of your S3 bucket.');
    } else {
      console.log(`✅ Found ${data.Contents.length} stock image files:\n`);
      
      // Group by base name
      const imageGroups = {};
      data.Contents.forEach(item => {
        const filename = item.Key.replace('images/', '');
        const baseName = filename.replace(/-full\.png|-small\.png|-thumb\.png/, '');
        
        if (!imageGroups[baseName]) {
          imageGroups[baseName] = [];
        }
        imageGroups[baseName].push(filename);
      });
      
      // Display grouped results
      Object.keys(imageGroups).forEach(baseName => {
        const files = imageGroups[baseName];
        const hasAll = files.length === 3;
        const icon = hasAll ? '✅' : '⚠️';
        
        console.log(`${icon} ${baseName}`);
        files.forEach(file => {
          console.log(`   - ${file}`);
        });
        
        if (!hasAll) {
          console.log(`   Missing: Need full, small, and thumb versions`);
        }
        console.log('');
      });
      
      console.log('\n📋 Summary:');
      console.log(`Total image groups: ${Object.keys(imageGroups).length}`);
      console.log(`Complete sets (all 3 sizes): ${Object.values(imageGroups).filter(g => g.length === 3).length}`);
    }
    
    console.log('\n🌐 Base URL for stock images:');
    console.log(`https://${process.env.S3_BUCKET}.${process.env.S3_REGION}.${process.env.S3_ENDPOINT}/images/`);
    
  } catch (error) {
    console.error('❌ Error listing S3 objects:', error.message);
    console.error('\nMake sure your S3 credentials are correct in .env file');
  }
}

// Run the check
listStockImages();
