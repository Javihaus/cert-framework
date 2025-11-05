import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

interface FormData {
  systemName: string;
  systemVersion: string;
  providerName: string;
  intendedPurpose: string;
  deploymentDate: string;
  riskLevel: 'high' | 'limited' | 'minimal' | '';
  riskCategories: string[];
  riskJustification: string;
  modelType: string;
  modelVersion: string;
  infrastructure: string;
  trainingData: string;
  dataQuality: string;
}

export async function POST(request: NextRequest) {
  console.log('[API] Compliance package generation requested');

  try {
    const formData: FormData = await request.json();

    // Validation
    if (!formData.systemName || !formData.providerName || !formData.riskLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: systemName, providerName, or riskLevel' },
        { status: 400 }
      );
    }

    // Create unique temp directory
    const tempDir = path.join('/tmp', `cert-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    console.log(`[API] Created temp directory: ${tempDir}`);

    try {
      // Transform form data into risk.json format
      const riskData = {
        metadata: {
          system_name: formData.systemName,
          system_version: formData.systemVersion || 'v1.0',
          provider_name: formData.providerName,
          generation_date: new Date().toISOString().split('T')[0],
        },
        classification: {
          risk_level: formData.riskLevel,
          title: getRiskTitle(formData.riskLevel),
          description: getRiskDescription(formData.riskLevel),
          high_risk_indicators: formData.riskLevel === 'high' ? formData.riskCategories.length || 1 : 0,
        },
        matched_categories: formData.riskLevel === 'high'
          ? (formData.riskCategories.length > 0
              ? formData.riskCategories.map((cat, idx) => ({
                  category: cat,
                  annex_reference: `Annex III (${idx + 1})`,
                }))
              : [{ category: 'To be specified', annex_reference: 'Annex III' }])
          : [],
        requirements: getRequirements(formData.riskLevel),
        justification: formData.riskJustification || '[EXPERT INPUT REQUIRED]',
      };

      // Transform form data into compliance.json format
      const complianceData = {
        metadata: {
          system_name: formData.systemName,
          system_version: formData.systemVersion || 'v1.0',
          provider_name: formData.providerName,
          generation_date: new Date().toISOString().split('T')[0],
        },
        annex_iv_documentation: {
          sections: {
            section_1_general: {
              data: {
                intended_purpose: formData.intendedPurpose || '[EXPERT INPUT REQUIRED]',
                deployment_date: formData.deploymentDate,
              },
            },
            section_2_architecture: {
              data: {
                model_type: formData.modelType || '[Not provided]',
                model_version: formData.modelVersion || '[Not provided]',
                infrastructure: formData.infrastructure || '[EXPERT INPUT REQUIRED]',
              },
            },
            section_3_data_governance: {
              data: {
                training_data: formData.trainingData || '[EXPERT INPUT REQUIRED]',
                data_quality: formData.dataQuality || '[EXPERT INPUT REQUIRED]',
              },
            },
          },
        },
        article_15_compliance: {
          metrics: {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            error_rate: 0,
            avg_response_time_ms: 0,
          },
        },
        trace_summary: {
          total_traces: 0,
          date_range: {
            start: formData.deploymentDate,
            end: new Date().toISOString().split('T')[0],
          },
        },
      };

      // Write JSON files
      const riskPath = path.join(tempDir, 'risk.json');
      const compliancePath = path.join(tempDir, 'compliance.json');

      await fs.writeFile(riskPath, JSON.stringify(riskData, null, 2));
      await fs.writeFile(compliancePath, JSON.stringify(complianceData, null, 2));
      console.log('[API] Wrote JSON input files');

      // Output directory for generated documents
      const outputDir = path.join(tempDir, 'documents');
      await fs.mkdir(outputDir, { recursive: true });

      // Path to Python script
      const scriptPath = path.join(process.cwd(), '..', 'scripts', 'populate_templates.py');

      if (!existsSync(scriptPath)) {
        throw new Error(`Python script not found at: ${scriptPath}`);
      }

      console.log(`[API] Running Python script: ${scriptPath}`);

      // Run Python script
      const pythonProcess = spawn('python3', [
        scriptPath,
        riskPath,
        compliancePath,
        '--output',
        outputDir,
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Wait for Python script to complete
      await new Promise<void>((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            console.log('[API] Python script completed successfully');
            console.log('[API] Output:', stdout);
            resolve();
          } else {
            console.error('[API] Python script failed with code:', code);
            console.error('[API] Error output:', stderr);
            reject(new Error(`Python script failed: ${stderr || 'Unknown error'}`));
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('[API] Failed to spawn Python process:', error);
          reject(error);
        });
      });

      // Create ZIP file
      const zipPath = path.join(tempDir, 'compliance_package.zip');
      console.log('[API] Creating ZIP file');

      const zipProcess = spawn('zip', [
        '-r',
        '-j', // Junk directory names (flat structure)
        zipPath,
        outputDir,
      ]);

      await new Promise<void>((resolve, reject) => {
        zipProcess.on('close', (code) => {
          if (code === 0) {
            console.log('[API] ZIP file created');
            resolve();
          } else {
            reject(new Error('ZIP creation failed'));
          }
        });
      });

      // Verify ZIP file exists
      const stats = await fs.stat(zipPath);
      if (stats.size === 0) {
        throw new Error('Generated ZIP file is empty');
      }

      console.log(`[API] ZIP file size: ${stats.size} bytes`);

      // Read ZIP file and return as blob
      const zipBuffer = await fs.readFile(zipPath);

      // Cleanup temp directory in background
      fs.rm(tempDir, { recursive: true, force: true }).catch((err) => {
        console.error('[API] Failed to cleanup temp directory:', err);
      });

      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${formData.systemName.replace(/\s+/g, '_')}_Compliance_Package.zip"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });

    } catch (error) {
      // Cleanup on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }

  } catch (error) {
    console.error('[API] Error:', error);

    return NextResponse.json(
      {
        error: 'Document generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getRiskTitle(riskLevel: string): string {
  switch (riskLevel) {
    case 'high':
      return 'High-Risk AI System';
    case 'limited':
      return 'Limited Risk AI System';
    case 'minimal':
      return 'Minimal Risk AI System';
    default:
      return 'AI System Classification Pending';
  }
}

function getRiskDescription(riskLevel: string): string {
  switch (riskLevel) {
    case 'high':
      return 'This system falls under Annex III high-risk categories and must comply with Articles 8-15 requirements.';
    case 'limited':
      return 'This system has limited risk and must comply with transparency obligations under Articles 50-52.';
    case 'minimal':
      return 'This system poses minimal risk and is subject to basic compliance requirements.';
    default:
      return 'Risk classification pending expert assessment.';
  }
}

function getRequirements(riskLevel: string): string[] {
  switch (riskLevel) {
    case 'high':
      return [
        'Article 8: Compliance with risk management system',
        'Article 9: Risk management system requirements',
        'Article 10: Data and data governance',
        'Article 11: Technical documentation (Annex IV)',
        'Article 12: Record-keeping',
        'Article 13: Transparency and provision of information',
        'Article 14: Human oversight',
        'Article 15: Accuracy, robustness, and cybersecurity',
      ];
    case 'limited':
      return [
        'Article 50: Transparency obligations for certain AI systems',
        'Article 52: Transparency obligations for specific AI systems',
      ];
    case 'minimal':
      return [
        'Article 13: Basic transparency obligations',
        'General good practices as recommended in EU AI Act',
      ];
    default:
      return [];
  }
}
