import { Box } from '@chakra-ui/react';
import { spacing, borderRadius, shadows, components } from '@/theme';

export default function Card(props: {
  variant?: string;
  children: React.ReactNode;
  [x: string]: any;
}) {
  const { variant, children, ...rest } = props;

  return (
    <Box
      bg="white"
      boxShadow={shadows.md}
      borderRadius={borderRadius.lg}
      p={components.card.padding.md}
      border={components.card.borderWidth}
      borderColor="transparent"
      {...rest}
    >
      {children}
    </Box>
  );
}
