#!/usr/bin/env node

/**
 * Figma to Code Sync Script
 * Fetches design data from Figma API and generates React components + design tokens
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { generateFullComponent } = require('./figma-component-generator');

// Configuration
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const OUTPUT_DIR = path.join(__dirname, '../generated');

if (!FIGMA_FILE_ID || !FIGMA_ACCESS_TOKEN) {
  console.error('Error: FIGMA_FILE_ID and FIGMA_ACCESS_TOKEN must be set');
  console.error('Usage: FIGMA_FILE_ID=abc123 FIGMA_ACCESS_TOKEN=xyz node figma-sync.js');
  process.exit(1);
}

/**
 * Fetch data from Figma API
 */
function fetchFigmaFile() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.figma.com',
      path: `/v1/files/${FIGMA_FILE_ID}`,
      method: 'GET',
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN,
      },
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Figma API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Extract color styles from Figma file
 */
function extractColors(figmaData) {
  const colors = {};

  if (figmaData.styles) {
    for (const [styleId, style] of Object.entries(figmaData.styles)) {
      if (style.styleType === 'FILL') {
        const node = findNodeById(figmaData.document, style.node_id);
        if (node && node.fills && node.fills[0]) {
          const fill = node.fills[0];
          if (fill.type === 'SOLID') {
            const color = rgbToHex(fill.color);
            colors[style.name] = color;
          }
        }
      }
    }
  }

  return colors;
}

/**
 * Extract text styles (typography) from Figma file
 */
function extractTypography(figmaData) {
  const typography = {};

  if (figmaData.styles) {
    for (const [styleId, style] of Object.entries(figmaData.styles)) {
      if (style.styleType === 'TEXT') {
        const node = findNodeById(figmaData.document, style.node_id);
        if (node && node.style) {
          typography[style.name] = {
            fontFamily: node.style.fontFamily,
            fontWeight: node.style.fontWeight,
            fontSize: `${node.style.fontSize}px`,
            lineHeight: node.style.lineHeightPx ? `${node.style.lineHeightPx}px` : 'normal',
            letterSpacing: node.style.letterSpacing ? `${node.style.letterSpacing}px` : 'normal',
          };
        }
      }
    }
  }

  return typography;
}

/**
 * Extract component definitions from Figma
 */
function extractComponents(figmaData) {
  const components = [];

  function traverse(node) {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      components.push({
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.absoluteBoundingBox?.width,
        height: node.absoluteBoundingBox?.height,
        children: node.children,
        fills: node.fills,
        strokes: node.strokes,
        effects: node.effects,
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(figmaData.document);
  return components;
}

/**
 * Find node by ID in Figma document tree
 */
function findNodeById(node, id) {
  if (node.id === id) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Convert RGB to Hex color
 */
function rgbToHex(rgb) {
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generate colors.ts file from extracted colors
 */
function generateColorsFile(colors) {
  const content = `// Auto-generated from Figma
// Last sync: ${new Date().toISOString()}

export const colors = ${JSON.stringify(colors, null, 2)};
`;
  return content;
}

/**
 * Generate typography.ts file from extracted typography
 */
function generateTypographyFile(typography) {
  const content = `// Auto-generated from Figma
// Last sync: ${new Date().toISOString()}

export const typography = ${JSON.stringify(typography, null, 2)};
`;
  return content;
}

/**
 * Generate React component from Figma component
 * (Using advanced generator from figma-component-generator.js)
 */
function generateReactComponent(figmaComponent) {
  return generateFullComponent(figmaComponent);
}

/**
 * Main sync function
 */
async function sync() {
  try {
    console.log('🎨 Fetching Figma file...');
    const figmaData = await fetchFigmaFile();
    console.log(`✅ Fetched file: ${figmaData.name}`);

    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(path.join(OUTPUT_DIR, 'components'), { recursive: true });

    // Extract design tokens
    console.log('\n📊 Extracting design tokens...');
    const colors = extractColors(figmaData);
    const typography = extractTypography(figmaData);
    const components = extractComponents(figmaData);

    console.log(`  - Found ${Object.keys(colors).length} color styles`);
    console.log(`  - Found ${Object.keys(typography).length} text styles`);
    console.log(`  - Found ${components.length} components`);

    // Generate files
    console.log('\n📝 Generating code...');

    // Generate colors file
    if (Object.keys(colors).length > 0) {
      const colorsContent = generateColorsFile(colors);
      await fs.writeFile(path.join(OUTPUT_DIR, 'colors.ts'), colorsContent);
      console.log('  ✅ Generated colors.ts');
    }

    // Generate typography file
    if (Object.keys(typography).length > 0) {
      const typographyContent = generateTypographyFile(typography);
      await fs.writeFile(path.join(OUTPUT_DIR, 'typography.ts'), typographyContent);
      console.log('  ✅ Generated typography.ts');
    }

    // Generate component files
    for (const component of components.slice(0, 5)) { // Limit to first 5 for now
      const componentContent = generateReactComponent(component);
      const fileName = component.name.replace(/[^a-zA-Z0-9]/g, '') + '.tsx';
      await fs.writeFile(path.join(OUTPUT_DIR, 'components', fileName), componentContent);
      console.log(`  ✅ Generated ${fileName}`);
    }

    // Generate sync report
    const report = {
      timestamp: new Date().toISOString(),
      figmaFile: figmaData.name,
      figmaFileId: FIGMA_FILE_ID,
      colorsCount: Object.keys(colors).length,
      typographyCount: Object.keys(typography).length,
      componentsCount: components.length,
      colors,
      typography,
      componentNames: components.map(c => c.name),
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'sync-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Sync complete!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`📄 Sync report: ${path.join(OUTPUT_DIR, 'sync-report.json')}`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run sync
sync();
