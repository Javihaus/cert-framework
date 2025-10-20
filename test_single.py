import sys

sys.path.insert(0, ".")
from cert.intelligent_comparator import IntelligentComparator

c = IntelligentComparator()
r = c.compare("$391 billion", "391B")
print(f"matched={r.matched} rule={r.rule} conf={r.confidence}")
