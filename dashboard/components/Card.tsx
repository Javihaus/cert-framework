import { Box } from '@chakra-ui/react';

export default function Card(props: {
  variant?: string;
  children: React.ReactNode;
  [x: string]: any;
}) {
  const { variant, children, ...rest } = props;

  return (
    <Box
      bg="white"
      boxShadow="14px 17px 40px 4px rgba(112, 144, 176, 0.08)"
      borderRadius="20px"
      p="20px"
      {...rest}
    >
      {children}
    </Box>
  );
}
