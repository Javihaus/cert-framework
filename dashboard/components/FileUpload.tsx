'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
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
    <Box>
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
          size="md"
          bg={colors.patience}
          color={colors.text.primary}
          _hover={{ bg: colors.mist }}
        >
          <Flex align="center" gap="8px">
            <MdUpload size={20} />
            <span>{label}</span>
          </Flex>
        </Button>
      </label>

      {fileName && (
        <Box
          mt="16px"
          bg="#e8f5e9"
          p="16px"
          borderRadius="8px"
        >
          <Flex align="center" gap="12px">
            <MdCheckCircle size={24} color={colors.success} />
            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.success}>
                File uploaded successfully
              </Text>
              <Text fontSize="14px" color={colors.text.secondary}>
                {fileName}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}

      {error && (
        <Box
          mt="16px"
          bg="#fee"
          p="16px"
          borderRadius="8px"
        >
          <Text fontSize="15px" color={colors.error} fontWeight="500">
            {error}
          </Text>
        </Box>
      )}
    </Box>
  );
}
