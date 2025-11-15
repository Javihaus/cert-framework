/**
 * CERT Framework Architecture Selector
 * Reference architectures and recommendation logic for AI system stacks
 */

import { ArchitectureInputs, ArchitectureRecommendation } from '@/types/wizard';

/**
 * Reference architectures database
 * Each architecture is production-tested and includes realistic cost estimates
 */
const REFERENCE_ARCHITECTURES: ArchitectureRecommendation[] = [
  {
    name: 'OpenAI + Pinecone (Production-Ready)',
    description: 'Battle-tested stack for RAG applications. OpenAI provides reliable LLM, Pinecone handles vector search at scale.',
    components: {
      llm: {
        provider: 'OpenAI',
        model: 'gpt-4-turbo',
        costPer1M: 10.00
      },
      vectorDb: {
        name: 'Pinecone',
        hosting: 'Managed SaaS',
        costPerMonth: 70
      },
      orchestration: {
        framework: 'LangChain',
        why: 'Mature ecosystem, extensive documentation, production-proven'
      },
      monitoring: {
        tools: ['CERT', 'Langfuse'],
        costPerMonth: 0
      }
    },
    totalEstimatedCost: 420,
    pros: [
      'Minimal ops overhead - both are managed services',
      'Scales automatically to high query volumes',
      'Strong ecosystem and community support',
      'Quick time to production (2-4 weeks)'
    ],
    cons: [
      'Higher cost than alternatives',
      'Vendor lock-in to both OpenAI and Pinecone',
      'Data leaves your infrastructure'
    ],
    complexity: 'low',
    codeExample: `from langchain.chat_models import ChatOpenAI
from langchain.vectorstores import Pinecone
from langchain.chains import RetrievalQA

llm = ChatOpenAI(model="gpt-4-turbo")
vectorstore = Pinecone.from_existing_index("your-index", embeddings)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever()
)

response = qa_chain.run("Your question here")`
  },

  {
    name: 'Anthropic Claude + Postgres pgvector (Cost-Optimized)',
    description: 'Lower cost alternative using Claude and open-source vector DB. Good for EU data residency requirements.',
    components: {
      llm: {
        provider: 'Anthropic',
        model: 'claude-3-sonnet',
        costPer1M: 3.00
      },
      vectorDb: {
        name: 'PostgreSQL with pgvector',
        hosting: 'Self-hosted or managed Postgres',
        costPerMonth: 25
      },
      orchestration: {
        framework: 'LangChain',
        why: 'Same familiar interface, works with both LLMs'
      },
      monitoring: {
        tools: ['CERT'],
        costPerMonth: 0
      }
    },
    totalEstimatedCost: 280,
    pros: [
      '30-40% lower LLM costs vs OpenAI',
      'Open-source vector DB, no vendor lock-in',
      'Can host in EU for data residency compliance',
      'Claude often produces better structured outputs',
      '200K context window for long documents'
    ],
    cons: [
      'Need to manage Postgres infrastructure',
      'Slightly more setup complexity',
      'Smaller ecosystem than OpenAI'
    ],
    complexity: 'medium',
    codeExample: `from anthropic import Anthropic
from langchain.vectorstores.pgvector import PGVector

client = Anthropic()
vectorstore = PGVector(
    connection_string="postgresql://...",
    embedding_function=embeddings
)

context = vectorstore.similarity_search(query, k=5)
response = client.messages.create(
    model="claude-3-sonnet-20240229",
    messages=[{
        "role": "user",
        "content": f"Context: {context}\\n\\nQuestion: {query}"
    }]
)`
  },

  {
    name: 'AWS Bedrock + OpenSearch (Enterprise AWS)',
    description: 'Full AWS stack for enterprises already on AWS. Meets compliance requirements, integrates with existing AWS infrastructure.',
    components: {
      llm: {
        provider: 'AWS Bedrock',
        model: 'Claude 3 Sonnet',
        costPer1M: 3.00
      },
      vectorDb: {
        name: 'Amazon OpenSearch Serverless',
        hosting: 'AWS Managed',
        costPerMonth: 120
      },
      orchestration: {
        framework: 'LangChain + boto3',
        why: 'Native AWS integration, IAM authentication'
      },
      monitoring: {
        tools: ['CERT', 'CloudWatch'],
        costPerMonth: 20
      }
    },
    totalEstimatedCost: 380,
    pros: [
      'Stays within AWS ecosystem',
      'IAM-based access control',
      'VPC-native, never leaves your account',
      'Meets most compliance frameworks out of the box',
      'CloudWatch integration for monitoring'
    ],
    cons: [
      'OpenSearch more expensive than alternatives',
      'AWS-specific knowledge required',
      'Bedrock has fewer model choices than OpenAI'
    ],
    complexity: 'medium',
    codeExample: `import boto3
import json

bedrock = boto3.client('bedrock-runtime')
opensearch = boto3.client('opensearchserverless')

# Vector search
results = opensearch.search(
    index='vectors',
    body={"query": {"match": {"text": query}}}
)

# LLM call
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        "prompt": f"Context: {results}\\n\\nQuestion: {query}"
    })
)`
  },

  {
    name: 'Local Llama 3 + Qdrant (Full Control)',
    description: 'Self-hosted open-source stack. For sensitive data, air-gapped environments, or cost optimization at very high scale.',
    components: {
      llm: {
        provider: 'Meta Llama 3',
        model: 'Llama-3-70B',
        costPer1M: 0.00  // Compute costs only
      },
      vectorDb: {
        name: 'Qdrant',
        hosting: 'Self-hosted',
        costPerMonth: 0
      },
      orchestration: {
        framework: 'LangChain',
        why: 'Same API for easy migration later'
      },
      monitoring: {
        tools: ['CERT', 'Prometheus'],
        costPerMonth: 0
      }
    },
    totalEstimatedCost: 150,  // Just infrastructure costs
    pros: [
      'Zero per-inference costs after setup',
      'Complete data control, nothing leaves premises',
      'Can fine-tune model for specific use case',
      'Scales economically at very high volume (>1M queries/month)',
      'No rate limits or quotas'
    ],
    cons: [
      'Requires GPU infrastructure ($1000+ upfront)',
      'Need ML ops expertise to maintain',
      'Higher latency than API calls (2-5s vs 500ms)',
      'Responsible for model quality and accuracy',
      'Ongoing infrastructure maintenance'
    ],
    complexity: 'high',
    codeExample: `from langchain.llms import Ollama
from langchain.vectorstores import Qdrant

llm = Ollama(model="llama3:70b")
vectorstore = Qdrant(
    client=qdrant_client,
    collection_name="docs"
)

context = vectorstore.similarity_search(query, k=5)
response = llm(
    f"Context: {context}\\n\\nQuestion: {query}"
)`
  }
];

/**
 * Select and rank architecture recommendations based on requirements
 */
export function selectArchitecture(inputs: ArchitectureInputs): ArchitectureRecommendation[] {
  // Filter and rank architectures based on inputs
  let candidates = [...REFERENCE_ARCHITECTURES];

  // Filter by budget (allow 20% over budget for better options)
  candidates = candidates.filter(arch =>
    arch.totalEstimatedCost <= inputs.budgetPerMonth * 1.2
  );

  // Filter by data residency
  if (inputs.dataResidency === 'eu') {
    candidates = candidates.filter(arch =>
      arch.name.includes('Claude') ||
      arch.name.includes('Local') ||
      arch.name.includes('AWS')  // AWS has EU regions
    );
  }

  // Filter by latency requirements (remove high complexity if low latency needed)
  if (inputs.latencyRequirementMs < 1000) {
    candidates = candidates.filter(arch => arch.complexity !== 'high');
  }

  // Rank by suitability
  candidates.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Prefer lower cost if budget-conscious
    if (inputs.budgetPerMonth < 500) {
      scoreA += (500 - a.totalEstimatedCost) / 100;
      scoreB += (500 - b.totalEstimatedCost) / 100;
    }

    // Prefer lower complexity if team lacks experience
    const hasMLOps = inputs.teamSkills.includes('ml-ops') || inputs.teamSkills.includes('devops');
    if (!hasMLOps) {
      scoreA += a.complexity === 'low' ? 10 : a.complexity === 'medium' ? 5 : 0;
      scoreB += b.complexity === 'low' ? 10 : b.complexity === 'medium' ? 5 : 0;
    }

    // Prefer AWS stack if team has AWS experience
    if (inputs.teamSkills.includes('aws')) {
      scoreA += a.name.includes('AWS') ? 10 : 0;
      scoreB += b.name.includes('AWS') ? 10 : 0;
    }

    // Prefer OpenAI if team has experience with it
    if (inputs.teamSkills.includes('openai')) {
      scoreA += a.name.includes('OpenAI') ? 8 : 0;
      scoreB += b.name.includes('OpenAI') ? 8 : 0;
    }

    // Prefer self-hosted if very high volume
    if (inputs.volumeQueriesPerMonth > 1000000) {
      scoreA += a.name.includes('Local') ? 15 : 0;
      scoreB += b.name.includes('Local') ? 15 : 0;
    }

    return scoreB - scoreA;
  });

  // Return top 3 recommendations (or fewer if filtered)
  return candidates.slice(0, 3);
}

/**
 * Get all available architectures (for browsing)
 */
export function getAllArchitectures(): ArchitectureRecommendation[] {
  return REFERENCE_ARCHITECTURES;
}

/**
 * Calculate estimated monthly cost based on usage
 */
export function calculateMonthlyCost(
  architecture: ArchitectureRecommendation,
  queriesPerMonth: number
): number {
  // Estimate average tokens per query (conservative estimate)
  const avgTokensPerQuery = 2000;  // 1000 input + 1000 output
  const totalTokensPerMonth = queriesPerMonth * avgTokensPerQuery;
  const millionTokens = totalTokensPerMonth / 1_000_000;

  const llmCost = millionTokens * architecture.components.llm.costPer1M;
  const infraCost = architecture.components.vectorDb.costPerMonth;
  const monitoringCost = architecture.components.monitoring.costPerMonth;

  return llmCost + infraCost + monitoringCost;
}
