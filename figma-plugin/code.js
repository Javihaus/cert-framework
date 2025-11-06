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
  sendProgress('Loading fonts...', 5);

  // Pre-load ALL fonts at the start to avoid any race conditions
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  } catch (error) {
    console.log('Inter font not available, using Roboto fallback');
    await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Roboto', style: 'Bold' });
  }

  sendProgress('Creating Design System page...', 10);

  // Create main page
  const page = figma.createPage();
  page.name = '🎨 Design System';
  figma.currentPage = page;

  let yOffset = 0;

  // ============================================
  // STEP 1: Create Color Styles & Palette
  // ============================================
  console.log('🎨 Creating color styles...');
  sendProgress('Creating color styles...', 20);

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
  colorTitle.characters = 'Color Palette';
  colorTitle.fontSize = 32;
  colorFrame.appendChild(colorTitle);

  // Create color swatches row
  const colorRow = figma.createFrame();
  colorRow.name = 'Colors';
  colorRow.layoutMode = 'HORIZONTAL';
  colorRow.itemSpacing = 16;
  colorRow.fills = [];

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
  typoTitle.characters = 'Typography';
  typoTitle.fontSize = 32;
  typoFrame.appendChild(typoTitle);

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
  componentTitle.characters = 'Component Library';
  componentTitle.fontSize = 32;
  componentFrame.appendChild(componentTitle);

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
  // STEP 4: Create Dashboard Pages
  // ============================================
  sendProgress('Creating dashboard pages...', 90);
  const layoutPage = figma.createPage();
  layoutPage.name = '📱 Dashboard Pages';
  figma.currentPage = layoutPage;

  let pageY = 0;

  // ============================================
  // PAGE 1: Home Page
  // ============================================
  const homePage = figma.createFrame();
  homePage.name = 'Page/Home';
  homePage.x = 0;
  homePage.y = pageY;
  homePage.resize(1440, 3200);
  homePage.fills = [{ type: 'SOLID', color: hexToRgb('FBF5F0') }];
  homePage.layoutMode = 'VERTICAL';
  homePage.paddingTop = 80;
  homePage.paddingLeft = 120;
  homePage.paddingRight = 120;
  homePage.itemSpacing = 72;

  // Navigation Header
  const navHome = figma.createFrame();
  navHome.name = 'Navigation';
  navHome.resize(1200, 64);
  navHome.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  navHome.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  navHome.strokeWeight = 1;
  navHome.cornerRadius = 8;
  navHome.layoutMode = 'HORIZONTAL';
  navHome.paddingLeft = 32;
  navHome.paddingRight = 32;
  navHome.itemSpacing = 32;
  navHome.counterAxisAlignItems = 'CENTER';

  const logoHome = figma.createText();
  logoHome.characters = 'CERT';
  logoHome.fontSize = 24;
  logoHome.fills = [{ type: 'SOLID', color: hexToRgb('3C6098') }];
  navHome.appendChild(logoHome);

  homePage.appendChild(navHome);

  // Hero Section
  const heroSection = figma.createFrame();
  heroSection.name = 'Hero';
  heroSection.resize(1200, 280);
  heroSection.fills = [];
  heroSection.layoutMode = 'VERTICAL';
  heroSection.primaryAxisAlignItems = 'CENTER';
  heroSection.itemSpacing = 24;

  const heroTitle = figma.createText();
  heroTitle.characters = 'AI systems you can deploy\nwith confidence';
  heroTitle.fontSize = 56;
  heroTitle.textAlignHorizontal = 'CENTER';
  heroTitle.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  heroTitle.resize(1000, 130);
  heroSection.appendChild(heroTitle);

  const heroSubtitle = figma.createText();
  heroSubtitle.characters = 'Built for the August 2025 EU AI Act deadline. Trace analysis that proves 90%+ accuracy.\nDocumentation ready for conformity assessment.';
  heroSubtitle.fontSize = 24;
  heroSubtitle.textAlignHorizontal = 'CENTER';
  heroSubtitle.fills = [{ type: 'SOLID', color: hexToRgb('3C6098') }];
  heroSubtitle.resize(800, 100);
  heroSection.appendChild(heroSubtitle);

  homePage.appendChild(heroSection);

  // Overview Card
  const overviewCard = figma.createFrame();
  overviewCard.name = 'Overview Card';
  overviewCard.resize(1200, 280);
  overviewCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  overviewCard.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  overviewCard.strokeWeight = 1;
  overviewCard.cornerRadius = 12;
  overviewCard.layoutMode = 'VERTICAL';
  overviewCard.paddingTop = 32;
  overviewCard.paddingBottom = 32;
  overviewCard.paddingLeft = 32;
  overviewCard.paddingRight = 32;
  overviewCard.itemSpacing = 20;

  const overviewTitle = figma.createText();
  overviewTitle.characters = 'What CERT Does';
  overviewTitle.fontSize = 28;
  overviewTitle.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  overviewCard.appendChild(overviewTitle);

  const overviewText = figma.createText();
  overviewText.characters = 'CERT combines production LLM monitoring with EU AI Act compliance automation.\nTrack accuracy, analyze failures, and generate audit-ready documentation automatically.';
  overviewText.fontSize = 18;
  overviewText.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  overviewText.resize(1100, 80);
  overviewCard.appendChild(overviewText);

  homePage.appendChild(overviewCard);

  // Features Grid
  const featuresGrid = figma.createFrame();
  featuresGrid.name = 'Features';
  featuresGrid.resize(1200, 240);
  featuresGrid.fills = [];
  featuresGrid.layoutMode = 'HORIZONTAL';
  featuresGrid.itemSpacing = 32;

  // Feature 1: Monitoring
  const feature1 = figma.createFrame();
  feature1.name = 'Monitoring Card';
  feature1.resize(584, 240);
  feature1.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  feature1.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  feature1.strokeWeight = 1;
  feature1.cornerRadius = 12;
  feature1.layoutMode = 'VERTICAL';
  feature1.paddingTop = 32;
  feature1.paddingBottom = 32;
  feature1.paddingLeft = 32;
  feature1.paddingRight = 32;
  feature1.itemSpacing = 16;

  const featureTitle1 = figma.createText();
  featureTitle1.characters = 'Production Monitoring';
  featureTitle1.fontSize = 24;
  featureTitle1.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  feature1.appendChild(featureTitle1);

  const featureText1 = figma.createText();
  featureText1.characters = 'Upload LLM traces to analyze accuracy, identify failures,\nand track performance metrics required by Article 15.';
  featureText1.fontSize = 16;
  featureText1.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  featureText1.resize(520, 60);
  feature1.appendChild(featureText1);

  featuresGrid.appendChild(feature1);

  // Feature 2: Documents
  const feature2 = figma.createFrame();
  feature2.name = 'Documents Card';
  feature2.resize(584, 240);
  feature2.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  feature2.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  feature2.strokeWeight = 1;
  feature2.cornerRadius = 12;
  feature2.layoutMode = 'VERTICAL';
  feature2.paddingTop = 32;
  feature2.paddingBottom = 32;
  feature2.paddingLeft = 32;
  feature2.paddingRight = 32;
  feature2.itemSpacing = 16;

  const featureTitle2 = figma.createText();
  featureTitle2.characters = 'Compliance Documents';
  featureTitle2.fontSize = 24;
  featureTitle2.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  feature2.appendChild(featureTitle2);

  const featureText2 = figma.createText();
  featureText2.characters = 'Generate 5 professional Word documents for EU AI Act\ncompliance: Risk Classification, Annex IV, and more.';
  featureText2.fontSize = 16;
  featureText2.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  featureText2.resize(520, 60);
  feature2.appendChild(featureText2);

  featuresGrid.appendChild(feature2);

  homePage.appendChild(featuresGrid);

  layoutPage.appendChild(homePage);

  pageY += 3300;

  // ============================================
  // PAGE 2: Monitoring Dashboard
  // ============================================
  sendProgress('Creating monitoring page...', 93);

  const monitoringPage = figma.createFrame();
  monitoringPage.name = 'Page/Monitoring';
  monitoringPage.x = 0;
  monitoringPage.y = pageY;
  monitoringPage.resize(1440, 2400);
  monitoringPage.fills = [{ type: 'SOLID', color: hexToRgb('FBF5F0') }];
  monitoringPage.layoutMode = 'VERTICAL';
  monitoringPage.paddingTop = 80;
  monitoringPage.paddingLeft = 120;
  monitoringPage.paddingRight = 120;
  monitoringPage.itemSpacing = 40;

  // Navigation
  const navMonitoring = figma.createFrame();
  navMonitoring.name = 'Navigation';
  navMonitoring.resize(1200, 64);
  navMonitoring.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  navMonitoring.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  navMonitoring.strokeWeight = 1;
  navMonitoring.cornerRadius = 8;
  navMonitoring.layoutMode = 'HORIZONTAL';
  navMonitoring.paddingLeft = 32;
  navMonitoring.paddingRight = 32;
  navMonitoring.itemSpacing = 32;
  navMonitoring.counterAxisAlignItems = 'CENTER';

  const logoMonitoring = figma.createText();
  logoMonitoring.characters = 'CERT';
  logoMonitoring.fontSize = 24;
  logoMonitoring.fills = [{ type: 'SOLID', color: hexToRgb('3C6098') }];
  navMonitoring.appendChild(logoMonitoring);

  monitoringPage.appendChild(navMonitoring);

  // Status Banner
  const statusBanner = figma.createFrame();
  statusBanner.name = 'Status Banner';
  statusBanner.resize(1200, 100);
  statusBanner.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [0.8, -0.8, 0.4],
      [0.8, 0.8, 0]
    ],
    gradientStops: [
      { position: 0, color: { r: 72/255, g: 187/255, b: 120/255, a: 1 } },
      { position: 1, color: { r: 56/255, g: 161/255, b: 105/255, a: 1 } }
    ]
  }];
  statusBanner.cornerRadius = 12;
  statusBanner.layoutMode = 'HORIZONTAL';
  statusBanner.paddingLeft = 32;
  statusBanner.paddingRight = 32;
  statusBanner.itemSpacing = 20;
  statusBanner.counterAxisAlignItems = 'CENTER';

  const statusText = figma.createText();
  statusText.characters = 'System Compliant';
  statusText.fontSize = 20;
  statusText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  statusBanner.appendChild(statusText);

  monitoringPage.appendChild(statusBanner);

  // Metrics Grid
  const metricsGrid = figma.createFrame();
  metricsGrid.name = 'Metrics';
  metricsGrid.resize(1200, 200);
  metricsGrid.fills = [];
  metricsGrid.layoutMode = 'HORIZONTAL';
  metricsGrid.itemSpacing = 24;

  for (let i = 0; i < 4; i++) {
    const metricCard = figma.createFrame();
    metricCard.name = `Metric ${i + 1}`;
    metricCard.resize(282, 200);
    metricCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    metricCard.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
    metricCard.strokeWeight = 1;
    metricCard.cornerRadius = 12;
    metricCard.layoutMode = 'VERTICAL';
    metricCard.paddingTop = 24;
    metricCard.paddingBottom = 24;
    metricCard.paddingLeft = 24;
    metricCard.paddingRight = 24;
    metricCard.itemSpacing = 16;

    const metricLabel = figma.createText();
    metricLabel.characters = ['Accuracy', 'Total Traces', 'Passed', 'Failed'][i];
    metricLabel.fontSize = 16;
    metricLabel.fills = [{ type: 'SOLID', color: hexToRgb('718096') }];
    metricCard.appendChild(metricLabel);

    const metricValue = figma.createText();
    metricValue.characters = ['92.5%', '1,234', '1,142', '92'][i];
    metricValue.fontSize = 40;
    metricValue.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
    metricCard.appendChild(metricValue);

    metricsGrid.appendChild(metricCard);
  }

  monitoringPage.appendChild(metricsGrid);

  // Chart Placeholder
  const chartCard = figma.createFrame();
  chartCard.name = 'Distribution Chart';
  chartCard.resize(1200, 400);
  chartCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  chartCard.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  chartCard.strokeWeight = 1;
  chartCard.cornerRadius = 12;
  chartCard.layoutMode = 'VERTICAL';
  chartCard.paddingTop = 32;
  chartCard.paddingBottom = 32;
  chartCard.paddingLeft = 32;
  chartCard.paddingRight = 32;
  chartCard.primaryAxisAlignItems = 'CENTER';
  chartCard.counterAxisAlignItems = 'CENTER';

  const chartTitle = figma.createText();
  chartTitle.characters = 'Confidence Score Distribution';
  chartTitle.fontSize = 24;
  chartTitle.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  chartCard.appendChild(chartTitle);

  const chartPlaceholder = figma.createFrame();
  chartPlaceholder.resize(1000, 250);
  chartPlaceholder.fills = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  chartPlaceholder.cornerRadius = 8;
  chartCard.appendChild(chartPlaceholder);

  monitoringPage.appendChild(chartCard);

  layoutPage.appendChild(monitoringPage);

  pageY += 2500;

  // ============================================
  // PAGE 3: Document Generation
  // ============================================
  sendProgress('Creating documents page...', 96);

  const docsPage = figma.createFrame();
  docsPage.name = 'Page/Documents';
  docsPage.x = 0;
  docsPage.y = pageY;
  docsPage.resize(1440, 2000);
  docsPage.fills = [{ type: 'SOLID', color: hexToRgb('FBF5F0') }];
  docsPage.layoutMode = 'VERTICAL';
  docsPage.paddingTop = 80;
  docsPage.paddingLeft = 120;
  docsPage.paddingRight = 120;
  docsPage.itemSpacing = 40;

  // Navigation
  const navDocs = figma.createFrame();
  navDocs.name = 'Navigation';
  navDocs.resize(1200, 64);
  navDocs.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  navDocs.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  navDocs.strokeWeight = 1;
  navDocs.cornerRadius = 8;
  navDocs.layoutMode = 'HORIZONTAL';
  navDocs.paddingLeft = 32;
  navDocs.paddingRight = 32;
  navDocs.itemSpacing = 32;
  navDocs.counterAxisAlignItems = 'CENTER';

  const logoDocs = figma.createText();
  logoDocs.characters = 'CERT';
  logoDocs.fontSize = 24;
  logoDocs.fills = [{ type: 'SOLID', color: hexToRgb('3C6098') }];
  navDocs.appendChild(logoDocs);

  docsPage.appendChild(navDocs);

  // Page Title
  const docsTitle = figma.createText();
  docsTitle.characters = 'Generate Compliance Documents';
  docsTitle.fontSize = 36;
  docsTitle.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  docsPage.appendChild(docsTitle);

  // Form Sections
  const formCard = figma.createFrame();
  formCard.name = 'Form';
  formCard.resize(1200, 800);
  formCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  formCard.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  formCard.strokeWeight = 1;
  formCard.cornerRadius = 12;
  formCard.layoutMode = 'VERTICAL';
  formCard.paddingTop = 32;
  formCard.paddingBottom = 32;
  formCard.paddingLeft = 32;
  formCard.paddingRight = 32;
  formCard.itemSpacing = 32;

  // Form Section 1
  const formSection1 = figma.createFrame();
  formSection1.name = 'Section';
  formSection1.resize(1100, 120);
  formSection1.fills = [];
  formSection1.layoutMode = 'VERTICAL';
  formSection1.itemSpacing = 12;

  const sectionTitle1 = figma.createText();
  sectionTitle1.characters = 'System Information';
  sectionTitle1.fontSize = 20;
  sectionTitle1.fills = [{ type: 'SOLID', color: hexToRgb('112358') }];
  formSection1.appendChild(sectionTitle1);

  const inputField1 = figma.createFrame();
  inputField1.resize(1100, 44);
  inputField1.fills = [{ type: 'SOLID', color: hexToRgb('FBF5F0') }];
  inputField1.strokes = [{ type: 'SOLID', color: hexToRgb('E6DDD6') }];
  inputField1.strokeWeight = 1;
  inputField1.cornerRadius = 8;
  inputField1.layoutMode = 'HORIZONTAL';
  inputField1.paddingLeft = 16;
  inputField1.counterAxisAlignItems = 'CENTER';

  const inputText1 = figma.createText();
  inputText1.characters = 'AI System Name';
  inputText1.fontSize = 15;
  inputText1.fills = [{ type: 'SOLID', color: hexToRgb('718096') }];
  inputField1.appendChild(inputText1);

  formSection1.appendChild(inputField1);
  formCard.appendChild(formSection1);

  // Generate Button
  const generateButton = figma.createFrame();
  generateButton.name = 'Generate Button';
  generateButton.resize(280, 56);
  generateButton.fills = [{ type: 'SOLID', color: hexToRgb('3C6098') }];
  generateButton.cornerRadius = 8;
  generateButton.layoutMode = 'HORIZONTAL';
  generateButton.primaryAxisAlignItems = 'CENTER';
  generateButton.counterAxisAlignItems = 'CENTER';
  generateButton.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 60/255, g: 96/255, b: 152/255, a: 0.2 },
    offset: { x: 0, y: 2 },
    radius: 8,
    visible: true,
    blendMode: 'NORMAL'
  }];

  const buttonText = figma.createText();
  buttonText.characters = 'Generate Documents';
  buttonText.fontSize = 15;
  buttonText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  generateButton.appendChild(buttonText);

  formCard.appendChild(generateButton);

  docsPage.appendChild(formCard);

  layoutPage.appendChild(docsPage);

  // Zoom to fit
  figma.viewport.scrollAndZoomIntoView([page]);

  sendProgress('Finishing up...', 100);

  // Show completion message
  figma.notify('✅ Design system created successfully! 🎉');

  console.log('🎉 Setup complete!');
  const stats = {
    colors: Object.keys(colors).length,
    textStyles: typography.length,
    components: 3,
    pages: 5  // Design System + 3 Dashboard Pages + Pages page
  };
  console.log(`Created:
  - ${stats.colors} color styles
  - ${stats.textStyles} text styles
  - ${stats.components} components
  - ${stats.pages} pages (including 3 full dashboard pages)`);

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
