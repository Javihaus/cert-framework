'use client';

import { useState } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import Button from './Button';

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
    <div>
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

      <label htmlFor="file-upload" className="cursor-pointer">
        <Button
          variant="secondary"
          icon={<Upload size={20} />}
          className="pointer-events-none"
        >
          {label}
        </Button>
      </label>

      {fileName && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-600 dark:text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-500">
                File uploaded successfully
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {fileName}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm font-medium text-red-600 dark:text-red-500">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
