'use client';

import { useState } from 'react';
import { Box, Button, Text, VStack, Flex } from '@chakra-ui/react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import { colors } from '@/theme/colors';

/**
 * Documents generation page.
 *
 * This page lets users generate compliance documents after uploading
 * and analyzing trace files.
 *
 * Flow:
 * 1. User clicks "Generate Documents"
 * 2. Frontend calls /api/generate-documents (Next.js API route)
 * 3. API route saves JSON data to temp files
 * 4. API route runs: python populate_templates.py risk.json compliance.json
 * 5. Python script reads JSONs, fills Word templates, outputs .docx files
 * 6. API route creates ZIP file from generated docs
 * 7. API route returns download URL to dashboard
 * 8. User clicks download link, gets ZIP file
 */

export default function DocumentsPage() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus('processing');
    setErrorMessage(null);

    // Get data from sessionStorage (saved when user uploaded files)
    const riskDataStr = sessionStorage.getItem('risk_classification');
    const complianceDataStr = sessionStorage.getItem('compliance_data');

    if (!riskDataStr || !complianceDataStr) {
      setStatus('error');
      setErrorMessage('Missing data. Please upload and analyze trace files first.');
      return;
    }

    try {
      // Call backend API
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskData: JSON.parse(riskDataStr),
          complianceData: JSON.parse(complianceDataStr)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || response.statusText);
      }

      const result = await response.json();

      setStatus('complete');
      setDownloadUrl(result.downloadUrl);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <Box p={8} maxW="800px" margin="0 auto">
      <VStack gap={6} align="stretch">
        <Box>
          <Text fontSize="32px" fontWeight="bold" mb={2}>
            Generate Compliance Documents
          </Text>
          <Text fontSize="16px" color="gray.600">
            Create Word documents for expert review and final delivery to client.
          </Text>
        </Box>

        {status === 'idle' && (
          <Box>
            <Box
              bg={colors.patience}
              borderLeft="4px solid"
              borderLeftColor={colors.cobalt}
              p="16px"
              borderRadius="8px"
              mb={4}
            >
              <Flex align="start" gap="12px">
                <Text fontSize="20px">ℹ️</Text>
                <Text fontSize="14px" color={colors.text.primary}>
                  This will generate 5 Word documents based on your trace analysis.
                  Documents will need expert review before delivery.
                </Text>
              </Flex>
            </Box>

            <Button
              onClick={handleGenerate}
              colorScheme="blue"
              size="lg"
              width="full"
            >
              Generate Document Package
            </Button>

            <Box mt={4} p={4} bg="gray.50" borderRadius="md">
              <Text fontSize="14px" fontWeight="bold" mb={2}>
                What will be generated:
              </Text>
              <VStack align="start" gap={1} fontSize="14px">
                <Text>• Risk Classification Report (2 pages)</Text>
                <Text>• Annex IV Technical Documentation (20-25 pages)</Text>
                <Text>• Audit Trail Setup Guide (3 pages)</Text>
                <Text>• Monitoring Framework (5 pages)</Text>
                <Text>• Conformity Assessment Checklist (2 pages)</Text>
              </VStack>
            </Box>
          </Box>
        )}

        {status === 'processing' && (
          <Box>
            <Flex align="center" gap="12px" mb={4}>
              <Text fontSize="18px">Generating documents</Text>
              <Flex gap="4px">
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    w="8px"
                    h="8px"
                    bg="blue.500"
                    borderRadius="full"
                    style={{
                      animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </Flex>
            </Flex>
            <Text fontSize="14px" color="gray.600">
              This takes 10-30 seconds depending on document size.
            </Text>
            <style jsx>{`
              @keyframes pulse {
                0%, 80%, 100% {
                  opacity: 0.3;
                  transform: scale(0.8);
                }
                40% {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </Box>
        )}

        {status === 'complete' && downloadUrl && (
          <Box>
            <Box
              bg="green.50"
              borderLeft="4px solid"
              borderLeftColor="green.500"
              p="16px"
              borderRadius="8px"
              mb={4}
            >
              <Flex align="start" gap="12px">
                <MdCheckCircle size={20} color={colors.success} />
                <Text fontSize="14px" color="green.800" fontWeight="600">
                  Documents generated successfully!
                </Text>
              </Flex>
            </Box>

            <a
              href={downloadUrl}
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.success,
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: '500',
                textDecoration: 'none',
                width: '100%',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Download Package (.zip)
            </a>

            <Box mt={6} p={4} bg="yellow.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="yellow.400">
              <Text fontSize="14px" fontWeight="bold" mb={2}>
                Next Steps - Expert Review Required
              </Text>
              <VStack align="start" gap={2} fontSize="14px">
                <Text>1. Extract the ZIP file</Text>
                <Text>2. Open each Word document</Text>
                <Text>3. Search for "[EXPERT INPUT REQUIRED]" markers</Text>
                <Text>4. Fill in expert commentary (estimated 8-10 hours)</Text>
                <Text>5. Export final documents to PDF</Text>
                <Text>6. Package PDFs for client delivery</Text>
              </VStack>
            </Box>
          </Box>
        )}

        {status === 'error' && (
          <Box
            bg="red.50"
            borderLeft="4px solid"
            borderLeftColor="red.500"
            p="16px"
            borderRadius="8px"
          >
            <Flex align="start" gap="12px">
              <MdCancel size={20} color={colors.error} />
              <Box>
                <Text fontWeight="bold" color="red.800">Error generating documents</Text>
                <Text fontSize="14px" color="red.700">{errorMessage}</Text>
              </Box>
            </Flex>
          </Box>
        )}

        <Box mt={8} p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="14px" fontWeight="bold" mb={2}>
            💡 How this works:
          </Text>
          <Text fontSize="14px" color="gray.700">
            The system auto-populates documents with data from your trace analysis.
            Sections requiring expert judgment are marked "[EXPERT INPUT REQUIRED]".
            You'll add your professional assessment, then deliver to the client.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
