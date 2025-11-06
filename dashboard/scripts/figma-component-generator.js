/**
 * Advanced Figma Component to React Generator
 * Converts Figma component nodes to React/Chakra UI code
 */

/**
 * Convert Figma node to React component code
 */
function generateReactFromNode(node, depth = 0) {
  const indent = '  '.repeat(depth);

  // Map Figma node types to React components
  switch (node.type) {
    case 'FRAME':
    case 'GROUP':
      return generateContainer(node, depth);

    case 'TEXT':
      return generateText(node, depth);

    case 'RECTANGLE':
      return generateBox(node, depth);

    case 'VECTOR':
      return generateIcon(node, depth);

    default:
      return `${indent}<Box>{/* ${node.type} */}</Box>`;
  }
}

/**
 * Generate container component (Box/Flex)
 */
function generateContainer(node, depth) {
  const indent = '  '.repeat(depth);
  const props = [];

  // Layout
  if (node.layoutMode === 'HORIZONTAL') {
    props.push('display="flex"');
    props.push('flexDirection="row"');
  } else if (node.layoutMode === 'VERTICAL') {
    props.push('display="flex"');
    props.push('flexDirection="column"');
  }

  // Spacing
  if (node.itemSpacing) {
    props.push(`gap="${node.itemSpacing}px"`);
  }

  if (node.paddingLeft || node.paddingTop) {
    props.push(`p="${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px"`);
  }

  // Size
  if (node.absoluteBoundingBox) {
    if (node.layoutGrow !== 1) {
      props.push(`w="${Math.round(node.absoluteBoundingBox.width)}px"`);
    }
    props.push(`h="${Math.round(node.absoluteBoundingBox.height)}px"`);
  }

  // Background
  if (node.fills && node.fills[0] && node.fills[0].type === 'SOLID') {
    const color = rgbToHex(node.fills[0].color);
    props.push(`bg="${color}"`);
  }

  // Border radius
  if (node.cornerRadius) {
    props.push(`borderRadius="${node.cornerRadius}px"`);
  }

  // Border
  if (node.strokes && node.strokes[0]) {
    const borderColor = rgbToHex(node.strokes[0].color);
    const borderWidth = node.strokeWeight || 1;
    props.push(`border="${borderWidth}px solid"`);
    props.push(`borderColor="${borderColor}"`);
  }

  const component = node.layoutMode ? 'Flex' : 'Box';
  const propsString = props.length > 0 ? '\n' + indent + '  ' + props.join('\n' + indent + '  ') + '\n' + indent : '';

  let children = '';
  if (node.children && node.children.length > 0) {
    children = '\n' + node.children.map(child => generateReactFromNode(child, depth + 1)).join('\n') + '\n' + indent;
  }

  return `${indent}<${component}${propsString}>${children}</${component}>`;
}

/**
 * Generate text component
 */
function generateText(node, depth) {
  const indent = '  '.repeat(depth);
  const props = [];

  // Typography
  if (node.style) {
    if (node.style.fontSize) {
      props.push(`fontSize="${node.style.fontSize}px"`);
    }
    if (node.style.fontWeight) {
      props.push(`fontWeight="${node.style.fontWeight}"`);
    }
    if (node.style.lineHeightPx) {
      props.push(`lineHeight="${node.style.lineHeightPx}px"`);
    }
    if (node.style.letterSpacing) {
      props.push(`letterSpacing="${node.style.letterSpacing}px"`);
    }
  }

  // Color
  if (node.fills && node.fills[0] && node.fills[0].type === 'SOLID') {
    const color = rgbToHex(node.fills[0].color);
    props.push(`color="${color}"`);
  }

  // Text alignment
  if (node.style && node.style.textAlignHorizontal) {
    const align = node.style.textAlignHorizontal.toLowerCase();
    props.push(`textAlign="${align}"`);
  }

  const propsString = props.length > 0 ? ' ' + props.join(' ') : '';
  const text = node.characters || 'Text';

  return `${indent}<Text${propsString}>\n${indent}  ${text}\n${indent}</Text>`;
}

/**
 * Generate box component
 */
function generateBox(node, depth) {
  const indent = '  '.repeat(depth);
  const props = [];

  // Size
  if (node.absoluteBoundingBox) {
    props.push(`w="${Math.round(node.absoluteBoundingBox.width)}px"`);
    props.push(`h="${Math.round(node.absoluteBoundingBox.height)}px"`);
  }

  // Background
  if (node.fills && node.fills[0] && node.fills[0].type === 'SOLID') {
    const color = rgbToHex(node.fills[0].color);
    props.push(`bg="${color}"`);
  }

  // Border radius
  if (node.cornerRadius) {
    props.push(`borderRadius="${node.cornerRadius}px"`);
  }

  // Border
  if (node.strokes && node.strokes[0]) {
    const borderColor = rgbToHex(node.strokes[0].color);
    const borderWidth = node.strokeWeight || 1;
    props.push(`border="${borderWidth}px solid"`);
    props.push(`borderColor="${borderColor}"`);
  }

  const propsString = props.length > 0 ? '\n' + indent + '  ' + props.join('\n' + indent + '  ') + '\n' + indent : '';

  return `${indent}<Box${propsString} />`;
}

/**
 * Generate icon component
 */
function generateIcon(node, depth) {
  const indent = '  '.repeat(depth);
  return `${indent}<Icon as={MdIcon} w="24px" h="24px" />`;
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(rgb) {
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generate full React component file
 */
function generateFullComponent(figmaComponent) {
  const componentName = figmaComponent.name.replace(/[^a-zA-Z0-9]/g, '');

  // Determine which Chakra UI components to import
  const imports = new Set(['Box']);

  function collectImports(node) {
    if (node.type === 'TEXT') imports.add('Text');
    if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
      imports.add('Flex');
    }
    if (node.type === 'VECTOR') imports.add('Icon');
    if (node.children) {
      node.children.forEach(collectImports);
    }
  }

  if (figmaComponent.children) {
    figmaComponent.children.forEach(collectImports);
  }

  const importsString = Array.from(imports).sort().join(', ');

  // Generate component body
  let componentBody = '<Box>';
  if (figmaComponent.children && figmaComponent.children.length > 0) {
    componentBody = figmaComponent.children.map(child => generateReactFromNode(child, 2)).join('\n');
  } else {
    componentBody = '  <Box>\n    {/* Component content */}\n  </Box>';
  }

  const content = `// Auto-generated from Figma
// Component: ${figmaComponent.name}
// Last sync: ${new Date().toISOString()}

import { ${importsString} } from '@chakra-ui/react';
import { MdIcon } from 'react-icons/md';

export default function ${componentName}() {
  return (
${componentBody}
  );
}
`;

  return content;
}

module.exports = {
  generateReactFromNode,
  generateFullComponent,
  rgbToHex,
};
