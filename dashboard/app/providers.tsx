'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

// Horizon UI color scheme defined in CSS variables
const customConfig = {
  ...defaultSystem,
  globalCss: {
    ':root': {
      '--chakra-colors-brand-50': '#E9E3FF',
      '--chakra-colors-brand-100': '#C0B8FE',
      '--chakra-colors-brand-200': '#A195FD',
      '--chakra-colors-brand-300': '#8171FC',
      '--chakra-colors-brand-400': '#7551FF',
      '--chakra-colors-brand-500': '#422AFB',
      '--chakra-colors-brand-600': '#3311DB',
      '--chakra-colors-brand-700': '#2111A5',
      '--chakra-colors-brand-800': '#190793',
      '--chakra-colors-brand-900': '#11047A',
      '--chakra-colors-secondaryGray-100': '#E0E5F2',
      '--chakra-colors-secondaryGray-200': '#E1E9F8',
      '--chakra-colors-secondaryGray-300': '#F4F7FE',
      '--chakra-colors-secondaryGray-400': '#E9EDF7',
      '--chakra-colors-secondaryGray-500': '#8F9BBA',
      '--chakra-colors-secondaryGray-600': '#A3AED0',
      '--chakra-colors-secondaryGray-700': '#707EAE',
      '--chakra-colors-secondaryGray-800': '#707EAE',
      '--chakra-colors-secondaryGray-900': '#1B2559',
    },
    'body': {
      'bg': '#F4F7FE',
      'fontFamily': 'DM Sans, sans-serif',
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={customConfig}>{children}</ChakraProvider>;
}
