'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { MdUpload, MdCheckCircle } from 'react-icons/md';
import { colors } from '@/theme/colors';

interface FileUploadProps {
  onFileLoad: (data: any) => void;
  accept: string;
  label: string;
}

export default function FileUpload({ onFileLoad, accept, label }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setError('');

    try {
      const text = await file.text();

      if (file.name.endsWith('.jsonl')) {
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => JSON.parse(line));
        onFileLoad(data);
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        onFileLoad(data);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setFileName('');
    }
  };

  return (
    <Box
      maxW="800px"
      mx="auto"
      bg="white"
      p="32px"
      borderRadius="12px"
      border="1px solid"
      borderColor={colors.patience}
    >
      <VStack gap="24px" align="stretch">
        <Box
          border="2px dashed"
          borderColor={isDragging ? colors.cobalt : colors.patience}
          borderRadius="12px"
          p="60px"
          textAlign="center"
          bg={isDragging ? colors.background : 'white'}
          transition="all 0.2s"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minH="280px"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileChange(file);
          }}
        >
          <Icon
            as={fileName ? MdCheckCircle : MdUpload}
            w="48px"
            h="48px"
            color={fileName ? colors.success : colors.navy}
            mb="20px"
          />

          {fileName ? (
            <Text fontSize="md" fontWeight="600" color={colors.success}>
              ✓ {fileName}
            </Text>
          ) : (
            <>
              <Text fontSize="16px" fontWeight="500" color={colors.navy} mb="8px">
                Drop your file here or click to browse
              </Text>
              <Text fontSize="14px" color={colors.text.muted} mb="20px">
                Supported formats: .json, .jsonl
              </Text>
            </>
          )}

          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChange(file);
            }}
            style={{ display: 'none' }}
            id="file-upload"
          />

          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <Button
              as="span"
              bg={colors.navy}
              color="white"
              px="32px"
              py="12px"
              h="auto"
              fontSize="15px"
              fontWeight="500"
              borderRadius="8px"
              _hover={{ bg: colors.cobalt }}
              transition="all 0.2s"
            >
              Choose File
            </Button>
          </label>
        </Box>

        {error && (
          <Text fontSize="sm" color={colors.error} textAlign="center">
            {error}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
