# LlamaIndex Integration Guide

Complete guide for integrating CERT Framework with LlamaIndex query engines, chat engines, and agents.

## Overview

CERT Framework provides seamless integration with LlamaIndex through wrapper functions that automatically monitor accuracy and compliance for query engines, chat engines, and agents.

## Installation

```bash
pip install cert-framework llama-index
```

## Quick Start

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from cert.integrations.llamaindex import wrap_llamaindex_engine

# Load documents and create index
documents = SimpleDirectoryReader("./medical_docs").load_data()
index = VectorStoreIndex.from_documents(documents)

# Create query engine
engine = index.as_query_engine(similarity_top_k=3)

# Wrap with CERT monitoring (one line!)
monitored_engine = wrap_llamaindex_engine(engine, preset="healthcare")

# Use normally - all queries are monitored
response = monitored_engine.query(
    "What are the contraindications for this medication?"
)

# Generate compliance report
from cert import export_report
export_report("data/audit.jsonl", "compliance_report.html")
```

## Query Engine Integration

### Basic Query Engine

```python
from cert.integrations.llamaindex import wrap_llamaindex_engine

# Wrap any LlamaIndex query engine
monitored_engine = wrap_llamaindex_engine(engine, preset="general")

# Query normally
response = monitored_engine.query("Your question")
```

### Different Response Modes

All LlamaIndex response modes are supported:

```python
# Tree summarize
engine = index.as_query_engine(response_mode="tree_summarize")
monitored = wrap_llamaindex_engine(engine, preset="healthcare")

# Compact
engine = index.as_query_engine(response_mode="compact")
monitored = wrap_llamaindex_engine(engine, preset="healthcare")

# Simple concatenate
engine = index.as_query_engine(response_mode="simple_concatenate")
monitored = wrap_llamaindex_engine(engine, preset="healthcare")
```

### Industry Presets

```python
# Healthcare (high-risk, 0.85 threshold)
monitored = wrap_llamaindex_engine(engine, preset="healthcare")

# Financial (0.80 threshold)
monitored = wrap_llamaindex_engine(engine, preset="financial")

# Legal (high-risk, 0.85 threshold)
monitored = wrap_llamaindex_engine(engine, preset="legal")

# General purpose (0.70 threshold)
monitored = wrap_llamaindex_engine(engine, preset="general")
```

## Chat Engine Integration

### Basic Chat Engine

```python
from cert.integrations.llamaindex import wrap_llamaindex_chat_engine

# Create chat engine
chat_engine = index.as_chat_engine()

# Wrap with monitoring
monitored_chat = wrap_llamaindex_chat_engine(
    chat_engine,
    preset="general"
)

# Chat normally
response = monitored_chat.chat("Hello, how are you?")
```

### Multi-Turn Conversations

```python
# First message
response1 = monitored_chat.chat("What is hypertension?")

# Follow-up (conversation history tracked)
response2 = monitored_chat.chat("What are the treatments?")

# All messages monitored
# Conversation history used as context
```

### Chat Modes

```python
# Context mode
chat_engine = index.as_chat_engine(chat_mode="context")
monitored = wrap_llamaindex_chat_engine(chat_engine, preset="healthcare")

# Condense question mode
chat_engine = index.as_chat_engine(chat_mode="condense_question")
monitored = wrap_llamaindex_chat_engine(chat_engine, preset="healthcare")
```

## Agent Integration

### Basic Agent

```python
from llama_index.core.agent import ReActAgent
from cert.integrations.llamaindex import wrap_llamaindex_agent

# Create agent
agent = ReActAgent.from_tools(tools, llm=llm)

# Wrap with monitoring
monitored_agent = wrap_llamaindex_agent(agent, preset="general")

# Use normally
response = monitored_agent.chat("What's the weather in SF?")
```

### Agent Tool Calls

```python
# Tool calls are captured as context
# Agent reasoning steps are logged
# Final answer is monitored against tool outputs
```

## Context Extraction

The integration automatically extracts context from LlamaIndex components:

### Source Nodes

```python
# Query engine returns response with source_nodes
response = engine.query("Question")

# CERT automatically extracts:
# - query: the question string
# - context: from source_nodes (node.node.text or node.text)
# - answer: from response.response
```

### Node Text Extraction

The integration handles different node structures:

```python
# Node with nested text
node.node.text  # Extracted automatically

# Node with direct text
node.text  # Extracted automatically

# Multiple nodes
# All node texts concatenated with \n\n separator
```

## Custom Configuration

```python
from cert.integrations.llamaindex import wrap_llamaindex_engine

# Custom monitoring configuration
custom_config = {
    "audit_log_path": "data/llamaindex_audit.jsonl",
    "threshold": 0.80,
    "require_approval": False,
    "circuit_breaker": True
}

monitored_engine = wrap_llamaindex_engine(
    engine,
    preset="financial",
    monitor_config=custom_config
)
```

## Advanced Features

### Custom Prompts

```python
from llama_index.core import PromptTemplate

# Custom prompt template
template = PromptTemplate(
    "Context: {context_str}\n"
    "Question: {query_str}\n"
    "Answer based only on the context above:"
)

engine = index.as_query_engine(text_qa_template=template)
monitored = wrap_llamaindex_engine(engine, preset="healthcare")
```

### Retriever Configuration

```python
# Configure retriever
engine = index.as_query_engine(
    similarity_top_k=5,  # More context
    similarity_cutoff=0.7,  # Higher quality
    response_mode="tree_summarize"
)

monitored = wrap_llamaindex_engine(engine, preset="healthcare")
```

### Streaming Responses

```python
# Streaming is preserved
engine = index.as_query_engine(streaming=True)
monitored = wrap_llamaindex_engine(engine, preset="general")

# Stream normally
response = monitored.query("Question")
for text in response.response_gen:
    print(text, end="")

# Complete response monitored after streaming
```

## Production Deployment

### Circuit Breaker

```python
# Enable circuit breaker for production
monitored_engine = wrap_llamaindex_engine(
    engine,
    preset="healthcare",
    monitor_config={
        "circuit_breaker": True,
        "failure_threshold": 0.7
    }
)
```

### Separate Systems

```python
# Different audit logs per system
def create_monitored_engine(system_id):
    return wrap_llamaindex_engine(
        engine,
        preset="healthcare",
        monitor_config={
            "audit_log_path": f"data/audit_{system_id}.jsonl"
        }
    )

engine_A = create_monitored_engine("system_A")
engine_B = create_monitored_engine("system_B")
```

### Automated Pipelines

```python
# No approval required for automated systems
monitored_engine = wrap_llamaindex_engine(
    engine,
    preset="financial",
    monitor_config={"require_approval": False}
)
```

## Compliance Reporting

### Generate Reports

```python
from cert import export_report

# Generate HTML compliance report
export_report(
    audit_log_path="data/audit.jsonl",
    output_path="llamaindex_compliance.html"
)
```

### Compliance Checking

```python
from cert import get_industry_preset

# Check compliance
preset = get_industry_preset("healthcare")

# Query and check
response = monitored_engine.query("Patient symptoms?")

# Compliance automatically logged in audit
```

## Examples

### Medical Q&A System

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from cert.integrations.llamaindex import wrap_llamaindex_engine

# Load medical documents
documents = SimpleDirectoryReader("./medical_docs").load_data()
index = VectorStoreIndex.from_documents(documents)

# Create engine with strict settings
engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="tree_summarize"
)

# Monitor with healthcare preset
monitored = wrap_llamaindex_engine(engine, preset="healthcare")

# Query
response = monitored.query("What are the side effects?")
print(response.response)
```

### Financial Analysis Bot

```python
from cert.integrations.llamaindex import wrap_llamaindex_chat_engine

# Financial documents
documents = SimpleDirectoryReader("./financial_reports").load_data()
index = VectorStoreIndex.from_documents(documents)

# Chat engine
chat_engine = index.as_chat_engine()

# Monitor with financial preset
monitored = wrap_llamaindex_chat_engine(chat_engine, preset="financial")

# Multi-turn conversation
response1 = monitored.chat("What was Q4 revenue?")
response2 = monitored.chat("How does that compare to Q3?")
```

### Research Assistant Agent

```python
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import FunctionTool
from cert.integrations.llamaindex import wrap_llamaindex_agent

# Define tools
def search_papers(query: str) -> str:
    # Search implementation
    return "Search results..."

search_tool = FunctionTool.from_defaults(fn=search_papers)

# Create agent
agent = ReActAgent.from_tools([search_tool], llm=llm)

# Monitor
monitored_agent = wrap_llamaindex_agent(agent, preset="general")

# Use
response = monitored_agent.chat("Find papers on transformers")
```

## Best Practices

1. **Choose Correct Preset**: Use high-risk presets for sensitive domains
2. **Configure Retrievers**: Use appropriate similarity_top_k for your use case
3. **Context Quality**: Ensure retrieved nodes are relevant
4. **Separate Logs**: Use different audit logs per system
5. **Test Thresholds**: Validate accuracy requirements
6. **Regular Reports**: Generate compliance reports regularly

## Troubleshooting

### Low Accuracy Scores

```python
# Increase number of retrieved nodes
engine = index.as_query_engine(similarity_top_k=10)

# Use better response mode
engine = index.as_query_engine(response_mode="tree_summarize")

# Improve embedding quality
from llama_index.embeddings.openai import OpenAIEmbedding
embed_model = OpenAIEmbedding(model="text-embedding-3-large")
```

### Missing Source Nodes

```python
# Ensure response includes source_nodes
# Some response modes may not include them

# Use modes that include sources:
# - tree_summarize
# - compact
# - accumulate
```

### Import Errors

```bash
# Install LlamaIndex
pip install llama-index

# For specific integrations
pip install llama-index-llms-openai
pip install llama-index-embeddings-openai
```

## See Also

- [LangChain Integration](langchain.md)
- [Anthropic Integration](anthropic.md)
- [OpenAI Integration](openai.md)
- [EU AI Act Compliance Guide](../compliance/eu-ai-act.md)
