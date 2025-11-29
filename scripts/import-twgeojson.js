const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// twgeojson GitHub raw URL - 使用 2010 年版本（五都升格後）
const GEOJSON_URL = 'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json';

async function downloadGeoJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function importCounties() {
  try {
    console.log('開始下載 twgeojson 縣市資料...');
    const geoJsonData = await downloadGeoJson(GEOJSON_URL);

    if (!geoJsonData || !geoJsonData.features) {
      throw new Error('GeoJSON 資料格式不正確');
    }

    console.log(`找到 ${geoJsonData.features.length} 個縣市資料`);

    // 清空現有資料（可選）
    console.log('清空現有資料...');
    await prisma.twGeoJson.deleteMany({});

    // 匯入每個縣市
    let successCount = 0;
    let errorCount = 0;

    for (const feature of geoJsonData.features) {
      try {
        const properties = feature.properties || {};
        const countyName = properties.COUNTYNAME || properties.Name || properties.name || '未知縣市';
        const countyId = properties.COUNTYCODE || properties.ID || properties.id || null;
        
        // 將整個 feature 轉換為 GeoJSON 字串（只包含該縣市的邊界）
        const countyGeoJson = JSON.stringify({
          type: 'Feature',
          geometry: feature.geometry,
          properties: properties
        });

        await prisma.twGeoJson.create({
          data: {
            CountyID: countyId ? String(countyId) : null,
            Name: countyName,
            Area: countyGeoJson,
          },
        });

        successCount++;
        console.log(`✓ 已匯入: ${countyName} (ID: ${countyId || 'N/A'})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ 匯入失敗: ${error.message}`);
      }
    }

    console.log('\n匯入完成！');
    console.log(`成功: ${successCount} 筆`);
    console.log(`失敗: ${errorCount} 筆`);
  } catch (error) {
    console.error('匯入過程發生錯誤:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 執行匯入
importCounties()
  .then(() => {
    console.log('所有操作完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('執行失敗:', error);
    process.exit(1);
  });

