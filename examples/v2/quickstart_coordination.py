"""CERT Framework Quickstart - Coordination Monitoring

Answer the question: "Are 2 agents better than 1?"

Measures coordination effectiveness using gamma (γ) metric:
- γ > 1.0: Coordination is HELPING
- γ < 1.0: Coordination is HURTING
- γ ≈ 1.0: No coordination effect

Use case: Multi-agent systems (LangChain, AutoGen, CrewAI)

Time to run: ~1 minute
"""

import cert


# ============================================
# STEP 1: Define Individual Agents
# ============================================


def agent_a(prompt: str) -> str:
    """Agent A - First stage analyzer.

    In production, this would be:
    return model_a.generate(prompt)
    """
    # Simulate Agent A (simple analysis)
    return f"Agent A analyzed: {prompt}. Key factors identified."


def agent_b(prompt: str) -> str:
    """Agent B - Second stage refiner.

    In production, this would be:
    return model_b.generate(prompt)
    """
    # Simulate Agent B (refinement)
    return f"Agent B refined: {prompt}. Detailed evaluation provided."


# ============================================
# STEP 2: Define Coordinated System
# ============================================


def coordinated_system(prompt: str) -> str:
    """Coordinated system: Agent A → Agent B.

    This is your multi-agent pipeline.
    """
    # Stage 1: Agent A processes initial prompt
    stage1_output = agent_a(prompt)

    # Stage 2: Agent B refines Agent A's output
    stage2_output = agent_b(f"Improve this analysis: {stage1_output}")

    return stage2_output


# ============================================
# STEP 3: Measure Coordination
# ============================================

# Test prompts for evaluation
test_prompts = [
    "Analyze the key factors in business strategy",
    "Evaluate the main considerations for project management",
    "Assess the critical elements in organizational change",
    "Identify the primary aspects of market analysis",
    "Examine the essential components of risk assessment",
]

print("Measuring coordination effectiveness...")
print("This will:")
print("1. Establish baseline for Agent A")
print("2. Establish baseline for Agent B")
print("3. Measure coordinated performance (A → B)")
print("4. Calculate gamma (γ) metric")
print()

result = cert.measure_coordination(
    agent_a=agent_a,
    agent_b=agent_b,
    coordinated_func=coordinated_system,
    test_prompts=test_prompts,
    trials_per_agent=5,  # 5 trials per agent
)

# ============================================
# STEP 4: View Results
# ============================================

print("=" * 60)
print("COORDINATION ANALYSIS RESULTS")
print("=" * 60)
print(f"Agent A Baseline:           {result.baseline_a:.3f}")
print(f"Agent B Baseline:           {result.baseline_b:.3f}")
print(f"Expected (A × B):           {result.baseline_a * result.baseline_b:.3f}")
print(f"Actual Coordinated:         {result.coordinated_performance:.3f}")
print()
print(f"Gamma (γ):                  {result.gamma:.3f}")
print()
print("INTERPRETATION:")
print(result.recommendation)
print("=" * 60)

# ============================================
# INTERPRETATION GUIDE
# ============================================

print("\n" + "=" * 60)
print("UNDERSTANDING GAMMA (γ)")
print("=" * 60)
print("""
γ = coordinated_performance / (baseline_a × baseline_b)

γ > 1.1:  Coordination is HELPING
          → Keep your multi-agent system
          → The agents work better together

γ = 0.9-1.1: No significant effect
          → Coordination overhead not worth it
          → Consider using single agent

γ < 0.9:  Coordination is HURTING
          → Your multi-agent system is worse than 1 agent
          → Simplify to single agent
          → Check for handoff quality loss
""")

print("=" * 60)
print("USE CASES")
print("=" * 60)
print("""
1. LANGCHAIN PIPELINES
   - Compare chain vs single model
   - Identify where coordination breaks down
   - Optimize handoff quality

2. AUTOGEN MULTI-AGENT
   - Measure if multiple agents help
   - Compare 2-agent vs 3-agent vs N-agent
   - Find optimal agent count

3. CREWAI COORDINATION
   - Evaluate crew effectiveness
   - Compare hierarchical vs sequential
   - Optimize crew composition

4. CUSTOM AGENT SYSTEMS
   - Validate multi-agent design decisions
   - Prove coordination value to stakeholders
   - Continuous monitoring of coordination health
""")

print("=" * 60)
print("\n✓ Quickstart complete!")
print("\nKey Takeaways:")
print("- Gamma (γ) measures if coordination helps or hurts")
print("- γ > 1.0 means agents work better together")
print("- γ < 1.0 means you should use a single agent instead")
print("- Use this to validate multi-agent system design")
print("- Works with LangChain, AutoGen, CrewAI, custom systems")
