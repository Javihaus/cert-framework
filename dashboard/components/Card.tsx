import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { colors, borderRadius, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: string;
  [key: string]: any;
}

export default function Card({
  children,
  variant = 'default',
  padding = spacing.cardPadding,
  ...rest
}: CardProps) {

  const variants = {
    default: {
      bg: 'white',
      border: `1px solid ${colors.patience}`,
      boxShadow: 'none',
    },
    bordered: {
      bg: 'white',
      border: `2px solid ${colors.cobalt}`,
      boxShadow: 'none',
    },
    elevated: {
      bg: 'white',
      border: `1px solid ${colors.patience}`,
      boxShadow: '0 4px 12px rgba(17, 35, 88, 0.08)',
    },
  };

  const style = variants[variant];

  return (
    <Box
      bg={style.bg}
      border={style.border}
      borderRadius={borderRadius.lg}
      p={padding}
      boxShadow={style.boxShadow}
      transition="box-shadow 0.2s"
      {...rest}
    >
      {children}
    </Box>
  );
}
