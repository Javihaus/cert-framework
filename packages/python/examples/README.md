# CERT Framework Examples

Four examples showing real-world semantic comparison use cases.

## Running Examples

```bash
# Install CERT first
pip install cert-framework

# Run any example
python examples/01_deduplication.py
python examples/02_ticket_classification.py
python examples/03_content_similarity.py
python examples/04_debugging_inspector.py
```

## Examples

1. **Document Deduplication** (`01_deduplication.py`)
   - Find duplicate documents in a corpus
   - Remove near-duplicates before processing
   - ~5 minutes runtime on 100 documents

2. **Support Ticket Classification** (`02_ticket_classification.py`)
   - Route new tickets by similarity to resolved tickets
   - Automatic categorization based on historical data
   - Shows precision/recall tradeoffs

3. **Content Similarity Search** (`03_content_similarity.py`)
   - Find similar articles in a small dataset
   - Batch comparison with performance notes
   - Suitable for datasets up to ~1000 items

4. **Debugging with Inspector** (`04_debugging_inspector.py`)
   - Understand why comparisons succeed or fail
   - Visualize similarity scores and thresholds
   - Tune threshold based on your data

## Performance Notes

CERT does pairwise comparison: comparing N documents to each other is O(N²).

- ✅ **Good for:** Deduplication, classification, small-scale search
- ❌ **Not for:** Large-scale vector search (use dedicated vector DBs)

**Scaling:**
- 100 documents to each other: ~5,000 comparisons, ~2-3 seconds
- 1,000 documents to each other: ~500,000 comparisons, ~3-4 minutes

For large-scale similarity search (>10K documents), use dedicated vector databases:
- **Managed:** Pinecone, Weaviate, Qdrant
- **Self-hosted:** FAISS, Annoy, Milvus
