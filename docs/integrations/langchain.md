# LangChain Integration Guide

Complete guide for integrating CERT Framework with LangChain chains and agents.

## Overview

CERT Framework provides seamless integration with LangChain through wrapper functions that automatically monitor accuracy and compliance. The integration requires zero changes to your existing LangChain code after wrapping.

## Installation

```bash
pip install cert-framework langchain
```

## Quick Start

```python
from langchain.chains import RetrievalQA
from langchain_openai import OpenAI
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from cert.integrations.langchain import wrap_langchain_chain

# Create your RAG pipeline
vectorstore = FAISS.from_texts(
    texts=["Patient has hypertension...", "Treatment involves..."],
    embedding=OpenAIEmbeddings()
)

chain = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    retriever=vectorstore.as_retriever()
)

# Wrap with CERT monitoring (one line!)
monitored_chain = wrap_langchain_chain(chain, preset="healthcare")

# Use normally - all calls are monitored
result = monitored_chain.invoke({
    "query": "What is the treatment for hypertension?"
})

# Generate compliance report
from cert import export_report
export_report("data/audit.jsonl", "compliance_report.html")
```

## Wrapping Chains

### Basic Chain Wrapping

```python
from cert.integrations.langchain import wrap_langchain_chain

# Wrap any LangChain chain
monitored_chain = wrap_langchain_chain(chain, preset="general")

# Invoke normally
result = monitored_chain.invoke({"query": "Your question"})
```

### Industry Presets

Choose the appropriate preset for your use case:

```python
# Healthcare (high-risk, 0.85 threshold)
monitored_chain = wrap_langchain_chain(chain, preset="healthcare")

# Financial (0.80 threshold)
monitored_chain = wrap_langchain_chain(chain, preset="financial")

# Legal (high-risk, 0.85 threshold)
monitored_chain = wrap_langchain_chain(chain, preset="legal")

# General purpose (0.70 threshold)
monitored_chain = wrap_langchain_chain(chain, preset="general")
```

### Custom Configuration

```python
# Custom monitoring configuration
custom_config = {
    "audit_log_path": "data/langchain_audit.jsonl",
    "threshold": 0.75,
    "require_approval": False,
    "circuit_breaker": True
}

monitored_chain = wrap_langchain_chain(
    chain,
    preset="healthcare",
    monitor_config=custom_config
)
```

## Wrapping Agents

### Agent Executor

```python
from langchain.agents import create_react_agent, AgentExecutor
from cert.integrations.langchain import wrap_langchain_agent

# Create agent
agent_executor = AgentExecutor(agent=agent, tools=tools)

# Wrap with monitoring
monitored_agent = wrap_langchain_agent(agent_executor, preset="general")

# Use normally
result = monitored_agent.invoke({"input": "What's the weather?"})
```

### Agent Reasoning

The integration automatically captures agent reasoning steps as context:

```python
# Agent reasoning steps are logged as context
# Tool calls and observations are included
# Final output is monitored against intermediate steps
```

## Callback Handler

For non-invasive monitoring, use the callback handler:

```python
from cert.integrations.langchain import create_monitored_callback

# Create callback
callback = create_monitored_callback(preset="healthcare")

# Add to any LangChain component
chain.invoke(
    {"query": "Your question"},
    callbacks=[callback]
)
```

### Callback Benefits

- **Non-invasive**: No wrapping needed
- **Flexible**: Works with any LangChain component
- **Automatic**: Context extracted from retrievers
- **Compatible**: Combines with other callbacks

## Context Extraction

The integration automatically extracts context from LangChain components:

### Source Documents

```python
# For RetrievalQA chains
result = {
    "result": "The answer",
    "source_documents": [doc1, doc2, doc3]
}

# CERT automatically extracts:
# - query: from inputs["query"]
# - context: from source_documents (doc.page_content)
# - answer: from result["result"]
```

### Different Input Keys

The integration handles various input key names:

```python
# Supported input keys (in priority order):
# - query
# - question
# - input

# All work automatically:
chain.invoke({"query": "..."})
chain.invoke({"question": "..."})
chain.invoke({"input": "..."})
```

### Different Output Keys

```python
# Supported output keys (in priority order):
# - result
# - answer
# - output

# All extracted automatically
```

## Error Handling

### Import Errors

```python
try:
    from cert.integrations.langchain import wrap_langchain_chain
except ImportError:
    print("LangChain not installed")
    print("Run: pip install langchain")
```

### Chain Errors

```python
# Original chain behavior is preserved
# Errors propagate normally
try:
    result = monitored_chain.invoke({"query": "..."})
except Exception as e:
    # Handle errors as usual
    print(f"Chain error: {e}")
```

## Production Deployment

### Automated Pipelines

```python
# Disable approval for automated systems
monitored_chain = wrap_langchain_chain(
    chain,
    preset="financial",
    monitor_config={"require_approval": False}
)
```

### Circuit Breaker

```python
# Enable circuit breaker for production safety
monitored_chain = wrap_langchain_chain(
    chain,
    preset="healthcare",
    monitor_config={
        "circuit_breaker": True,
        "failure_threshold": 0.7  # Stop if accuracy drops below 70%
    }
)
```

### Separate Audit Logs

```python
# Use separate audit logs per system
monitored_chain = wrap_langchain_chain(
    chain,
    preset="healthcare",
    monitor_config={
        "audit_log_path": f"data/audit_{system_id}.jsonl"
    }
)
```

## Compliance Reporting

### Generate Reports

```python
from cert import export_report

# Generate HTML report
export_report(
    audit_log_path="data/audit.jsonl",
    output_path="compliance_report.html"
)
```

### Report Contents

The report includes:
- **Section 1**: Executive Summary
- **Section 2**: Accuracy Metrics
- **Section 3**: EU AI Act Article 15 Compliance
- **Section 4**: Detailed Evaluation Results
- **Section 5**: Risk Analysis
- **Section 6**: Technical Details
- **Section 7**: Failure Analysis

### Scheduled Reporting

```python
import schedule
import time

def generate_daily_report():
    export_report("data/audit.jsonl", f"report_{date.today()}.html")

schedule.every().day.at("00:00").do(generate_daily_report)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## Examples

### RAG Pipeline

```python
from langchain.chains import RetrievalQA
from cert.integrations.langchain import wrap_langchain_chain

# Create RAG pipeline
chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever()
)

# Monitor
monitored = wrap_langchain_chain(chain, preset="healthcare")
result = monitored.invoke({"query": "Patient symptoms?"})
```

### Conversational Chain

```python
from langchain.chains import ConversationChain
from cert.integrations.langchain import wrap_langchain_chain

# Create conversation chain
conversation = ConversationChain(llm=llm, memory=memory)

# Monitor
monitored = wrap_langchain_chain(conversation, preset="general")
result = monitored.invoke({"input": "Hello"})
```

### Multi-Step Agent

```python
from langchain.agents import AgentExecutor
from cert.integrations.langchain import wrap_langchain_agent

# Create agent with tools
agent_executor = AgentExecutor(agent=agent, tools=tools)

# Monitor
monitored = wrap_langchain_agent(agent_executor, preset="general")
result = monitored.invoke({"input": "Calculate 2+2"})
```

## Best Practices

1. **Choose Correct Preset**: Use high-risk presets (healthcare, legal) for sensitive applications
2. **Separate Audit Logs**: Use different log files for different systems
3. **Monitor Production**: Use circuit breaker in production
4. **Regular Reports**: Generate compliance reports regularly
5. **Context Quality**: Ensure retrievers return relevant context
6. **Test Thresholds**: Validate accuracy thresholds match your requirements

## Troubleshooting

### Low Accuracy Scores

```python
# Check context quality
# Ensure retriever returns relevant documents
# Adjust similarity threshold in retriever

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 5}  # Return more documents
)
```

### Missing Context

```python
# Use callback handler for better context extraction
callback = create_monitored_callback(preset="healthcare")
chain.invoke({"query": "..."}, callbacks=[callback])
```

### Import Errors

```bash
# Install LangChain
pip install langchain

# For OpenAI
pip install langchain-openai

# For vector stores
pip install faiss-cpu  # or faiss-gpu
```

## See Also

- [LlamaIndex Integration](llamaindex.md)
- [Anthropic Integration](anthropic.md)
- [OpenAI Integration](openai.md)
- [EU AI Act Compliance Guide](../compliance/eu-ai-act.md)
