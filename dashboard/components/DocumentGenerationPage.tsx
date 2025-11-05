'use client';

import { useState } from 'react';
import { Box, Button, Flex, Text, Grid, Input, Textarea } from '@chakra-ui/react';
import { colors } from '@/theme/colors';
import Card from '@/components/Card';

interface FormData {
  // System Metadata
  systemName: string;
  systemVersion: string;
  providerName: string;
  intendedPurpose: string;
  deploymentDate: string;

  // Risk Classification
  riskLevel: 'high' | 'limited' | 'minimal' | '';
  riskCategories: string[];
  riskJustification: string;

  // Architecture
  modelType: string;
  modelVersion: string;
  infrastructure: string;

  // Data Governance
  trainingData: string;
  dataQuality: string;
}

export default function DocumentGenerationPage() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    systemName: '',
    systemVersion: 'v1.0',
    providerName: '',
    intendedPurpose: '',
    deploymentDate: new Date().toISOString().split('T')[0],
    riskLevel: '',
    riskCategories: [],
    riskJustification: '',
    modelType: '',
    modelVersion: '',
    infrastructure: '',
    trainingData: '',
    dataQuality: '',
  });

  // Try to load data from sessionStorage if available
  const loadFromTraces = () => {
    const complianceDataStr = sessionStorage.getItem('compliance_data');
    const riskDataStr = sessionStorage.getItem('risk_classification');

    if (complianceDataStr && riskDataStr) {
      const complianceData = JSON.parse(complianceDataStr);
      const riskData = JSON.parse(riskDataStr);

      setFormData(prev => ({
        ...prev,
        systemName: complianceData.metadata?.system_name || prev.systemName,
        systemVersion: complianceData.metadata?.system_version || prev.systemVersion,
        providerName: complianceData.metadata?.provider_name || prev.providerName,
        riskLevel: riskData.classification?.risk_level || prev.riskLevel,
      }));
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.systemName || !formData.providerName) {
      setError('Please fill in System Name and Provider Name');
      return;
    }

    if (!formData.riskLevel) {
      setError('Please select a Risk Level');
      return;
    }

    setGenerating(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const response = await fetch('/api/generate-compliance-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      // Get blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${formData.systemName.replace(/\s+/g, '_')}_Compliance_Package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Box maxW="1000px" mx="auto" p="32px">
      {/* Header */}
      <Box mb="32px">
        <Text fontSize="28px" fontWeight="700" color={colors.navy} mb="8px">
          EU AI Act Compliance Package Generator
        </Text>
        <Text fontSize="15px" color={colors.text.secondary} lineHeight="1.6">
          Generate 5 professional Word documents (32 pages total) for EU AI Act compliance.
          Fill in the fields below, and we'll create a ZIP package ready for expert review.
        </Text>
      </Box>

      {/* Load from traces button */}
      <Box mb="24px">
        <Button
          onClick={loadFromTraces}
          size="sm"
          bg={colors.patience}
          color={colors.text.primary}
          _hover={{ bg: colors.mist }}
        >
          📥 Load Data from Traces (if available)
        </Button>
      </Box>

      {/* Section 1: System Metadata */}
      <Card style={{ borderColor: colors.patience, marginBottom: '24px' }}>
        <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="16px">
          1. System Identification
        </Text>

        <Grid templateColumns="1fr 1fr" gap="16px">
          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
              System Name *
            </Text>
            <Input
              value={formData.systemName}
              onChange={(e) => updateField('systemName', e.target.value)}
              placeholder="e.g., Customer Support AI Assistant"
              bg="white"
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
              System Version
            </Text>
            <Input
              value={formData.systemVersion}
              onChange={(e) => updateField('systemVersion', e.target.value)}
              placeholder="e.g., v1.0"
              bg="white"
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
              Provider Name *
            </Text>
            <Input
              value={formData.providerName}
              onChange={(e) => updateField('providerName', e.target.value)}
              placeholder="e.g., Acme Corp"
              bg="white"
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
              Deployment Date
            </Text>
            <Input
              type="date"
              value={formData.deploymentDate}
              onChange={(e) => updateField('deploymentDate', e.target.value)}
              bg="white"
            />
          </Box>
        </Grid>

        <Box mt="16px">
          <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
            Intended Purpose
          </Text>
          <Textarea
            value={formData.intendedPurpose}
            onChange={(e) => updateField('intendedPurpose', e.target.value)}
            placeholder="Describe what the AI system does and its intended use cases..."
            rows={3}
            bg="white"
          />
        </Box>
      </Card>

      {/* Section 2: Risk Classification */}
      <Card style={{ borderColor: colors.patience, marginBottom: '24px' }}>
        <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="16px">
          2. Risk Classification (Annex III)
        </Text>

        <Box mb="16px">
          <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
            Risk Level *
          </Text>
          <select
            value={formData.riskLevel}
            onChange={(e) => updateField('riskLevel', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <option value="">Select risk level...</option>
            <option value="high">HIGH RISK - Annex III categories matched</option>
            <option value="limited">LIMITED RISK - Transparency obligations</option>
            <option value="minimal">MINIMAL RISK - Basic compliance</option>
          </select>
        </Box>

        {formData.riskLevel === 'high' && (
          <Box
            bg="#fef5e7"
            p="16px"
            borderRadius="8px"
            borderLeft="4px solid"
            borderLeftColor={colors.coral}
            mb="16px"
          >
            <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
              ⚠️ High-Risk System Requirements
            </Text>
            <Text fontSize="13px" lineHeight="1.6" color={colors.text.primary}>
              High-risk systems must comply with Articles 8-15: risk management, data governance,
              technical documentation, transparency, human oversight, accuracy, robustness, and cybersecurity.
            </Text>
          </Box>
        )}

        <Box>
          <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
            Risk Justification
          </Text>
          <Textarea
            value={formData.riskJustification}
            onChange={(e) => updateField('riskJustification', e.target.value)}
            placeholder="Explain why the system falls into this risk category..."
            rows={3}
            bg="white"
          />
        </Box>
      </Card>

      {/* Section 3: Architecture */}
      <Card style={{ borderColor: colors.patience, marginBottom: '24px' }}>
        <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="16px">
          3. System Architecture
        </Text>

        <Grid templateColumns="1fr 1fr" gap="16px" mb="16px">
          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
              Model Type
            </Text>
            <Input
              value={formData.modelType}
              onChange={(e) => updateField('modelType', e.target.value)}
              placeholder="e.g., GPT-4, Claude 3, Custom LLM"
              bg="white"
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
              Model Version
            </Text>
            <Input
              value={formData.modelVersion}
              onChange={(e) => updateField('modelVersion', e.target.value)}
              placeholder="e.g., gpt-4-turbo-2024-04"
              bg="white"
            />
          </Box>
        </Grid>

        <Box>
          <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
            Infrastructure Description
          </Text>
          <Textarea
            value={formData.infrastructure}
            onChange={(e) => updateField('infrastructure', e.target.value)}
            placeholder="Describe cloud provider, compute resources, geographic location..."
            rows={3}
            bg="white"
          />
        </Box>
      </Card>

      {/* Section 4: Data Governance */}
      <Card style={{ borderColor: colors.patience, marginBottom: '32px' }}>
        <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="16px">
          4. Data Governance
        </Text>

        <Box mb="16px">
          <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
            Training Data Description
          </Text>
          <Textarea
            value={formData.trainingData}
            onChange={(e) => updateField('trainingData', e.target.value)}
            placeholder="Describe training data sources, collection methods, and preprocessing..."
            rows={3}
            bg="white"
          />
        </Box>

        <Box>
          <Text fontSize="14px" fontWeight="600" color={colors.text.primary} mb="6px">
            Data Quality Measures
          </Text>
          <Textarea
            value={formData.dataQuality}
            onChange={(e) => updateField('dataQuality', e.target.value)}
            placeholder="Describe quality assurance processes, bias mitigation, validation methods..."
            rows={3}
            bg="white"
          />
        </Box>
      </Card>

      {/* Error Display */}
      {error && (
        <Box
          bg="#fee"
          borderLeft="4px solid"
          borderLeftColor={colors.error}
          p="16px"
          borderRadius="8px"
          mb="24px"
        >
          <Flex align="start" gap="12px">
            <Text fontSize="20px">❌</Text>
            <Box>
              <Text fontWeight="600" color={colors.error}>Error</Text>
              <Text fontSize="14px" color={colors.text.primary}>{error}</Text>
            </Box>
          </Flex>
        </Box>
      )}

      {/* Success Display */}
      {downloadUrl && (
        <Box
          bg="#e8f5e9"
          borderLeft="4px solid"
          borderLeftColor={colors.success}
          p="16px"
          borderRadius="8px"
          mb="24px"
        >
          <Flex align="start" gap="12px" mb="16px">
            <Text fontSize="20px">✅</Text>
            <Box>
              <Text fontWeight="600" color={colors.success}>Package Generated Successfully!</Text>
              <Text fontSize="14px" color={colors.text.primary}>
                Your compliance package is ready for download.
              </Text>
            </Box>
          </Flex>
          <Button
            onClick={handleDownload}
            bg={colors.success}
            color="white"
            size="lg"
            width="full"
            _hover={{ opacity: 0.9 }}
          >
            📥 Download Compliance Package (.zip)
          </Button>
        </Box>
      )}

      {/* Generate Button */}
      <Flex gap="16px" justify="space-between" align="center">
        <Box flex="1">
          <Text fontSize="13px" color={colors.text.muted} lineHeight="1.5">
            This will generate 5 Word documents: Risk Classification Report (2p),
            Annex IV Technical Documentation (20-25p), Audit Trail Guide (3p),
            Monitoring Framework (5p), and Conformity Checklist (2p).
          </Text>
        </Box>
        <Button
          onClick={handleGenerate}
          disabled={generating || !formData.systemName || !formData.providerName || !formData.riskLevel}
          bg={colors.cobalt}
          color="white"
          size="lg"
          minW="240px"
          _hover={{ opacity: 0.9 }}
        >
          {generating ? (
            <Flex align="center" gap="8px">
              <Box>Generating</Box>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  w="6px"
                  h="6px"
                  bg="white"
                  borderRadius="full"
                  style={{
                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </Flex>
          ) : (
            '🚀 Generate Compliance Package'
          )}
        </Button>
      </Flex>

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
  );
}
