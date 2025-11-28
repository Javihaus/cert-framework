'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import { cn } from '@/lib/utils';
import { LuCircleCheckBig, LuCircleX, LuPackage, LuCode as CodeIcon, LuRepeat2 } from 'react-icons/lu';

interface Connector {
  name: string;
  platform: string;
  status: 'available' | 'planned';
  description: string;
  features: string[];
  installCommand: string;
  usageExample: string;
  releaseDate?: string;
}

const CONNECTORS: Connector[] = [
  {
    name: 'OpenAI',
    platform: 'openai',
    status: 'available',
    description: 'Automatic tracing for OpenAI SDK (chat, completions, embeddings)',
    features: [
      'Zero-code instrumentation',
      'Automatic cost calculation',
      'Token usage tracking',
      'Latency measurement',
      'Error logging',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.auto import *

# That's it! All OpenAI calls are now traced
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Traces automatically logged to cert_traces.jsonl`,
  },
  {
    name: 'Anthropic',
    platform: 'anthropic',
    status: 'available',
    description: 'Automatic tracing for Anthropic SDK (messages, tool use)',
    features: [
      'Zero-code instrumentation',
      'Automatic cost calculation',
      'Token usage tracking',
      'Tool use logging',
      'Streaming support',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.auto import *

# All Anthropic calls are now traced
client = anthropic.Anthropic()
message = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)

# Traces automatically logged to cert_traces.jsonl`,
  },
  {
    name: 'LangChain',
    platform: 'langchain',
    status: 'available',
    description: 'Callback-based tracing for chains, agents, and tools',
    features: [
      'Full chain visibility',
      'Agent action tracking',
      'Tool invocation logs',
      'Retrieval logging',
      'Custom callback support',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.langchain import CertCallbackHandler
from langchain.chains import LLMChain

callback = CertCallbackHandler()

chain = LLMChain(llm=llm, callbacks=[callback])
result = chain.run("Your prompt")

# All chain steps logged to cert_traces.jsonl`,
  },
  {
    name: 'AWS Bedrock',
    platform: 'bedrock',
    status: 'available',
    description: 'boto3 client wrapper for Bedrock models',
    features: [
      'Claude via Bedrock',
      'Cost estimation',
      'Token tracking',
      'Model version logging',
      'Region tracking',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.auto import *

# Use boto3 as normal - tracing is automatic
bedrock = boto3.client('bedrock-runtime')
response = bedrock.invoke_model(
    modelId="anthropic.claude-3-sonnet-20240229-v1:0",
    body=json.dumps({"messages": [...]})
)

# Traces automatically logged`,
  },
  {
    name: 'Google Vertex AI',
    platform: 'vertex',
    status: 'planned',
    description: 'Support for Google Vertex AI models',
    features: [
      'Gemini models',
      'PaLM models',
      'Cost tracking',
      'Token usage',
      'Streaming support',
    ],
    installCommand: 'Coming Q2 2026',
    usageExample: '# Implementation planned for Q2 2026',
    releaseDate: 'Q2 2026',
  },
];

export default function ConnectorsPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'planned'>('available');
  const availableConnectors = CONNECTORS.filter((c) => c.status === 'available');
  const plannedConnectors = CONNECTORS.filter((c) => c.status === 'planned');

  const displayedConnectors = activeTab === 'available' ? availableConnectors : plannedConnectors;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
          Connectors
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Automatic tracing for all major AI platforms with zero code changes
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <LuRepeat2 size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Quick Start
          </h2>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-md font-mono text-sm mb-4">
          pip install cert-framework[integrations]
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Then add this single line to your code:
        </p>
        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-md font-mono text-sm mt-2">
          from cert.integrations.auto import *
        </div>
        <p className="text-sm text-green-600 dark:text-green-500 mt-4 font-medium">
          All AI API calls are now automatically traced to cert_traces.jsonl
        </p>
      </Card>

      {/* Tabs */}
      <div className="border-b-2 border-zinc-200 dark:border-zinc-700 mb-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              'px-4 py-2 font-medium text-sm transition-colors',
              activeTab === 'available'
                ? 'bg-blue-600 text-white rounded-t-md'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            )}
          >
            Available ({availableConnectors.length})
          </button>
          <button
            onClick={() => setActiveTab('planned')}
            className={cn(
              'px-4 py-2 font-medium text-sm transition-colors',
              activeTab === 'planned'
                ? 'bg-blue-600 text-white rounded-t-md'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            )}
          >
            Planned ({plannedConnectors.length})
          </button>
        </div>
      </div>

      {/* Connectors List */}
      <div className="flex flex-col gap-6">
        {displayedConnectors.map((connector) => (
          <Card key={connector.platform}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {connector.name}
                  </h3>
                  {connector.status === 'available' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <LuCircleCheckBig size={14} className="text-green-600 dark:text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-500">
                        Available
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                      <LuPackage size={14} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {connector.releaseDate}
                      </span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {connector.description}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {connector.status === 'available' ? 'Features:' : 'Planned Features:'}
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {connector.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <LuCircleCheckBig
                      size={14}
                      className={cn(
                        connector.status === 'available'
                          ? 'text-blue-600 dark:text-blue-500'
                          : 'text-zinc-400 dark:text-zinc-500'
                      )}
                    />
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Installation - only for available connectors */}
            {connector.status === 'available' && (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                    Installation:
                  </h4>
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md font-mono text-sm">
                    {connector.installCommand}
                  </div>
                </div>

                {/* Usage Example */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                    Usage Example:
                  </h4>
                  <pre className="bg-zinc-900 text-white p-4 rounded-md text-xs overflow-x-auto font-mono leading-relaxed">
                    {connector.usageExample}
                  </pre>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
