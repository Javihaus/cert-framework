// CERT Dashboard Auto-Setup Plugin
// This plugin automatically creates your entire design system in Figma

console.log('🎨 CERT Dashboard Auto-Setup Starting...');

// Color definitions from your dashboard
const colors = {
  // Primary Colors
  cobalt: { name: 'Cobalt', hex: '3C6098', r: 60/255, g: 96/255, b: 152/255 },
  navy: { name: 'Navy', hex: '112358', r: 17/255, g: 35/255, b: 88/255 },
  coral: { name: 'Coral', hex: 'E48B59', r: 228/255, g: 139/255, b: 89/255 },

  // Neutrals
  background: { name: 'Background', hex: 'FBF5F0', r: 251/255, g: 245/255, b: 240/255 },
  patience: { name: 'Patience', hex: 'E6DDD6', r: 230/255, g: 221/255, b: 214/255 },
  mist: { name: 'Mist', hex: 'BFC8D8', r: 191/255, g: 200/255, b: 216/255 },

  // Semantic
  success: { name: 'Success', hex: '48bb78', r: 72/255, g: 187/255, b: 120/255 },
  warning: { name: 'Warning', hex: 'E48B59', r: 228/255, g: 139/255, b: 89/255 },
  error: { name: 'Error', hex: 'fc8181', r: 252/255, g: 129/255, b: 129/255 },

  // Text
  textPrimary: { name: 'Text/Primary', hex: '112358', r: 17/255, g: 35/255, b: 88/255 },
  textSecondary: { name: 'Text/Secondary', hex: '3C6098', r: 60/255, g: 96/255, b: 152/255 },
  textMuted: { name: 'Text/Muted', hex: '718096', r: 113/255, g: 128/255, b: 150/255 },
};

// Typography definitions
const typography = [
  { name: 'Heading 1', fontSize: 56, fontWeight: 700, lineHeight: { unit: 'PERCENT', value: 110 }, letterSpacing: { unit: 'PIXELS', value: -2 } },
  { name: 'Heading 2', fontSize: 36, fontWeight: 700, lineHeight: { unit: 'PERCENT', value: 120 }, letterSpacing: { unit: 'PIXELS', value: -1 } },
  { name: 'Heading 3', fontSize: 28, fontWeight: 700, lineHeight: { unit: 'PERCENT', value: 130 }, letterSpacing: { unit: 'PIXELS', value: -0.5 } },
  { name: 'Heading 4', fontSize: 24, fontWeight: 700, lineHeight: { unit: 'PERCENT', value: 130 } },
  { name: 'Heading 5', fontSize: 18, fontWeight: 600, lineHeight: { unit: 'PERCENT', value: 140 } },
  { name: 'Body/Large', fontSize: 18, fontWeight: 400, lineHeight: { unit: 'PERCENT', value: 160 } },
  { name: 'Body/Default', fontSize: 16, fontWeight: 400, lineHeight: { unit: 'PERCENT', value: 160 } },
  { name: 'Body/Small', fontSize: 15, fontWeight: 400, lineHeight: { unit: 'PERCENT', value: 160 } },
  { name: 'Button', fontSize: 15, fontWeight: 500 },
  { name: 'Label', fontSize: 15, fontWeight: 600 },
  { name: 'Caption', fontSize: 14, fontWeight: 500, lineHeight: { unit: 'PERCENT', value: 150 } },
];

// Helper: Create paint style (color)
function createColorStyle(name, r, g, b) {
  const style = figma.createPaintStyle();
  style.name = name;
  style.paints = [{
    type: 'SOLID',
    color: { r, g, b }
  }];
  return style;
}

// Helper: Create text style
function createTextStyle(name, fontSize, fontWeight, lineHeight, letterSpacing) {
  const style = figma.createTextStyle();
  style.name = name;
  style.fontSize = fontSize;

  // Set font family and weight
  const fontName = { family: 'Inter', style: fontWeight >= 700 ? 'Bold' : fontWeight >= 600 ? 'Semi Bold' : fontWeight >= 500 ? 'Medium' : 'Regular' };

  // Load font before setting
  figma.loadFontAsync(fontName).then(() => {
    style.fontName = fontName;
  }).catch(() => {
    // Fallback to system font if Inter not available
    figma.loadFontAsync({ family: 'Roboto', style: 'Regular' }).then(() => {
      style.fontName = { family: 'Roboto', style: 'Regular' };
    });
  });

  if (lineHeight) {
    style.lineHeight = lineHeight;
  }

  if (letterSpacing) {
    style.letterSpacing = letterSpacing;
  }

  return style;
}

// Helper: Create component frame
function createComponent(name, width, height, x, y) {
  const component = figma.createComponent();
  component.name = name;
  component.resize(width, height);
  component.x = x;
  component.y = y;
  return component;
}

// Helper: Hex to RGB
function hexToRgb(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return { r, g, b };
}

// Helper: Send progress to UI
function sendProgress(text, percent) {
  figma.ui.postMessage({ type: 'progress', text, percent });
}

// Main setup function
async function setupDesignSystem() {
  console.log('📝 Creating Design System...');
  sendProgress('Creating Design System page...', 5);

  // Create main page
  const page = figma.createPage();
  page.name = '🎨 Design System';
  figma.currentPage = page;

  let yOffset = 0;

  // ============================================
  // STEP 1: Create Color Styles & Palette
  // ============================================
  console.log('🎨 Creating color styles...');
  sendProgress('Creating color styles...', 15);

  const colorFrame = figma.createFrame();
  colorFrame.name = 'Color Palette';
  colorFrame.x = 0;
  colorFrame.y = yOffset;
  colorFrame.resize(1200, 600);
  colorFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  colorFrame.layoutMode = 'VERTICAL';
  colorFrame.paddingTop = 40;
  colorFrame.paddingBottom = 40;
  colorFrame.paddingLeft = 40;
  colorFrame.paddingRight = 40;
  colorFrame.itemSpacing = 32;

  // Add title
  const colorTitle = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Bold' })
  );
  colorTitle.characters = 'Color Palette';
  colorTitle.fontSize = 32;
  colorFrame.appendChild(colorTitle);

  // Create color swatches
  let colorX = 0;
  const colorRow = figma.createFrame();
  colorRow.name = 'Colors';
  colorRow.layoutMode = 'HORIZONTAL';
  colorRow.itemSpacing = 16;
  colorRow.fills = [];

  // Pre-load font for all labels
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
  );

  for (const color of Object.values(colors)) {
    // Create color style
    createColorStyle(color.name, color.r, color.g, color.b);

    // Create visual swatch
    const swatch = figma.createFrame();
    swatch.name = color.name;
    swatch.resize(120, 120);
    swatch.fills = [{ type: 'SOLID', color: { r: color.r, g: color.g, b: color.b } }];
    swatch.cornerRadius = 12;

    // Add label
    const label = figma.createText();
    label.characters = color.name;
    label.fontSize = 14;
    label.x = 8;
    label.y = swatch.height + 8;
    swatch.appendChild(label);

    colorRow.appendChild(swatch);
  }

  colorFrame.appendChild(colorRow);
  page.appendChild(colorFrame);

  console.log(`✅ Created ${Object.keys(colors).length} color styles`);
  sendProgress('Color styles created!', 35);

  yOffset += 650;

  // ============================================
  // STEP 2: Create Text Styles & Typography
  // ============================================
  console.log('📝 Creating text styles...');
  sendProgress('Creating typography styles...', 45);

  const typoFrame = figma.createFrame();
  typoFrame.name = 'Typography';
  typoFrame.x = 0;
  typoFrame.y = yOffset;
  typoFrame.resize(1200, 800);
  typoFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  typoFrame.layoutMode = 'VERTICAL';
  typoFrame.paddingTop = 40;
  typoFrame.paddingBottom = 40;
  typoFrame.paddingLeft = 40;
  typoFrame.paddingRight = 40;
  typoFrame.itemSpacing = 24;

  // Add title
  const typoTitle = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Bold' })
  );
  typoTitle.characters = 'Typography';
  typoTitle.fontSize = 32;
  typoFrame.appendChild(typoTitle);

  // Pre-load font for all samples
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
  );

  // Create text samples
  for (const typo of typography) {
    createTextStyle(typo.name, typo.fontSize, typo.fontWeight, typo.lineHeight, typo.letterSpacing);

    const sample = figma.createText();
    sample.characters = `${typo.name} - ${typo.fontSize}px`;
    sample.fontSize = typo.fontSize;
    typoFrame.appendChild(sample);
  }

  page.appendChild(typoFrame);

  console.log(`✅ Created ${typography.length} text styles`);
  sendProgress('Typography styles created!', 60);

  yOffset += 850;

  // ============================================
  // STEP 3: Create Component Library
  // ============================================
  console.log('🧩 Creating components...');
  sendProgress('Creating components...', 70);

  const componentFrame = figma.createFrame();
  componentFrame.name = 'Components';
  componentFrame.x = 0;
  componentFrame.y = yOffset;
  componentFrame.resize(1600, 1000);
  componentFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  componentFrame.layoutMode = 'VERTICAL';
  componentFrame.paddingTop = 40;
  componentFrame.paddingBottom = 40;
  componentFrame.paddingLeft = 40;
  componentFrame.paddingRight = 40;
  componentFrame.itemSpacing = 40;

  // Add title
  const componentTitle = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Bold' })
  );
  componentTitle.characters = 'Component Library';
  componentTitle.fontSize = 32;
  componentFrame.appendChild(componentTitle);

  // Pre-load fonts for components
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
  );

  // Component 1: Button/Primary
  const buttonPrimary = figma.createComponent();
  buttonPrimary.name = 'Button/Primary';
  buttonPrimary.resize(180, 56);
  buttonPrimary.fills = [{ type: 'SOLID', color: hexToRgb('3C6098') }];
  buttonPrimary.cornerRadius = 8;

  const buttonText = figma.createText();
  buttonText.characters = 'Button';
  buttonText.fontSize = 15;
  buttonText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  buttonText.x = (buttonPrimary.width - buttonText.width) / 2;
  buttonText.y = (buttonPrimary.height - buttonText.height) / 2;
  buttonPrimary.appendChild(buttonText);
  componentFrame.appendChild(buttonPrimary);

  // Component 2: Button/Secondary
  const buttonSecondary = figma.createComponent();
  buttonSecondary.name = 'Button/Secondary';
  buttonSecondary.resize(180, 56);
  buttonSecondary.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  buttonSecondary.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  buttonSecondary.strokeWeight = 1;
  buttonSecondary.cornerRadius = 8;

  const buttonText2 = figma.createText();
  buttonText2.characters = 'Button';
  buttonText2.fontSize = 15;
  buttonText2.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  buttonText2.x = (buttonSecondary.width - buttonText2.width) / 2;
  buttonText2.y = (buttonSecondary.height - buttonText2.height) / 2;
  buttonSecondary.appendChild(buttonText2);
  componentFrame.appendChild(buttonSecondary);

  // Component 3: Card
  const card = figma.createComponent();
  card.name = 'Card/Default';
  card.resize(400, 300);
  card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  card.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  card.strokeWeight = 1;
  card.cornerRadius = 12;
  card.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.05 },
    offset: { x: 0, y: 2 },
    radius: 8,
    visible: true,
    blendMode: 'NORMAL'
  }];
  componentFrame.appendChild(card);

  page.appendChild(componentFrame);

  console.log('✅ Created 3 components');
  sendProgress('Components created!', 85);

  // ============================================
  // STEP 4: Create sample page layout
  // ============================================
  sendProgress('Creating sample pages...', 90);
  const layoutPage = figma.createPage();
  layoutPage.name = '📱 Pages';

  const homePage = figma.createFrame();
  homePage.name = 'Page/Home';
  homePage.resize(1440, 1024);
  homePage.fills = [{ type: 'SOLID', color: hexToRgb('FBF5F0') }];

  // Pre-load font for hero text
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }).catch(() =>
    figma.loadFontAsync({ family: 'Roboto', style: 'Bold' })
  );

  const heroText = figma.createText();
  heroText.characters = 'AI systems you can deploy\nwith confidence';
  heroText.fontSize = 56;
  heroText.textAlignHorizontal = 'CENTER';
  heroText.x = (homePage.width - 800) / 2;
  heroText.y = 200;
  heroText.resize(800, 200);
  homePage.appendChild(heroText);

  layoutPage.appendChild(homePage);

  // Zoom to fit
  figma.viewport.scrollAndZoomIntoView([page]);

  // Show completion message
  figma.notify('✅ Design system created successfully! 🎉');

  console.log('🎉 Setup complete!');
  const stats = {
    colors: Object.keys(colors).length,
    textStyles: typography.length,
    components: 3,
    pages: 2
  };
  console.log(`Created:
  - ${stats.colors} color styles
  - ${stats.textStyles} text styles
  - ${stats.components} components
  - ${stats.pages} pages`);

  // Send completion to UI
  figma.ui.postMessage({
    type: 'complete',
    data: stats
  });
}

// Show UI
figma.showUI(__html__, { width: 440, height: 560 });

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate') {
    try {
      await setupDesignSystem();
    } catch (error) {
      console.error('❌ Error:', error);
      figma.ui.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
};
