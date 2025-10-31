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
import Card from './Card';

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
    <Card>
      <VStack gap="20px" align="stretch">
        <Text fontSize="lg" fontWeight="700" color="secondaryGray.900">
          {label}
        </Text>

        <Box
          border="2px dashed"
          borderColor={isDragging ? 'brand.500' : 'secondaryGray.400'}
          borderRadius="16px"
          p="40px"
          textAlign="center"
          bg={isDragging ? 'brand.50' : 'transparent'}
          transition="all 0.2s"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
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
            w="40px"
            h="40px"
            color={fileName ? 'green.500' : 'brand.500'}
            mb="12px"
            mx="auto"
          />

          {fileName ? (
            <Text fontSize="md" fontWeight="500" color="green.500">
              ✓ {fileName}
            </Text>
          ) : (
            <>
              <Text fontSize="md" fontWeight="500" color="secondaryGray.900" mb="8px">
                Drop your file here or click to browse
              </Text>
              <Text fontSize="sm" color="secondaryGray.600">
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

          <label htmlFor="file-upload" style={{ display: 'inline-block', marginTop: '16px', cursor: 'pointer' }}>
            <Button
              as="span"
              bg="brand.500"
              color="white"
              _hover={{ bg: 'brand.600' }}
            >
              Choose File
            </Button>
          </label>
        </Box>

        {error && (
          <Text fontSize="sm" color="red.500">
            {error}
          </Text>
        )}
      </VStack>
    </Card>
  );
}
