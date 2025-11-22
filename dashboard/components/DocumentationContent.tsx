'use client';

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
}

function HelpSection({ title, children }: HelpSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

interface ExampleBoxProps {
  children: React.ReactNode;
}

function ExampleBox({ children }: ExampleBoxProps) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg my-3">
      {children}
    </div>
  );
}

export default function DocumentationContent() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-5">
        Understanding CERT Metrics
      </h1>

      <HelpSection title="Accuracy vs. Confidence: What's the Difference?">
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          These two metrics measure different aspects of your AI system's performance, and understanding
          the distinction is critical for compliance.
        </p>

        <ExampleBox>
          <p className="text-base text-zinc-900 dark:text-white mb-1">
            <strong>Accuracy</strong>: Binary classification at a threshold. You're saying
            "above 0.70 = correct, below = incorrect." So 87.3% of your traces passed that threshold.
          </p>
        </ExampleBox>

        <ExampleBox>
          <p className="text-base text-zinc-900 dark:text-white mb-1">
            <strong>Mean Confidence</strong>: The average raw score across all predictions.
            This tells you how far above the line you are on average.
          </p>
        </ExampleBox>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          You could have 87% accuracy with mean confidence of 0.71 (barely passing) or 0.95
          (strongly passing). These are very different situations.
        </p>
      </HelpSection>

      <HelpSection title="Which Metric Matters?">
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          Empirically, it depends on what happens when you're wrong.
        </p>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
          <strong className="text-zinc-900 dark:text-white">For compliance officers:</strong> If you need to know "are we meeting the regulatory
          threshold or not," <strong>accuracy</strong> is what matters. It's a hard boundary. Either
          you're compliant or you're not.
        </p>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <strong className="text-zinc-900 dark:text-white">For AI managers:</strong> If you want to know "are we trending toward trouble,"
          <strong> mean confidence</strong> is more useful. It gives you leading indicators. If mean
          confidence drops from 0.85 to 0.78, you're still compliant but something changed.
        </p>
      </HelpSection>

      <HelpSection title="What About Failed Requests?">
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          The critical question: Are these random noise, or is there a systematic pattern?
        </p>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
          <strong className="text-zinc-900 dark:text-white">If systematic</strong> (like "all requests about X topic fail"): This is a bias
          problem, not just a performance problem. The EU AI Act cares about systematic failures
          much more than random errors.
        </p>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          <strong className="text-zinc-900 dark:text-white">If random</strong>: High mean confidence suggests you're close to the
          boundary. Small improvements will push you over 90%.
        </p>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Use the <strong>Distribution</strong> tab to analyze clustering. Use the
          <strong> Failed Traces</strong> tab to identify patterns.
        </p>
      </HelpSection>

      <HelpSection title="The Compliance Threshold (90%)">
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          The 90% accuracy threshold is based on:
        </p>

        <ul className="ml-5 text-base text-zinc-500 dark:text-zinc-400 leading-loose mb-3 list-disc">
          <li>Industry standards for high-risk AI systems</li>
          <li>EU AI Act Article 15 requirements for "appropriate accuracy"</li>
          <li>Risk assessment showing acceptable error rate with human oversight</li>
          <li>Empirical validation on production data</li>
        </ul>

        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Below threshold doesn't mean the system is failing - it means you need to investigate
          failures to determine if they're systematic or random, then take corrective action.
        </p>
      </HelpSection>

      <HelpSection title="What Actions Should I Take?">
        <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
          Based on typical compliance scenarios:
        </p>

        <ol className="ml-5 text-base text-zinc-500 dark:text-zinc-400 leading-loose list-decimal">
          <li>Review high-volume failure patterns (Incomplete, Missing Info) - fixable issues</li>
          <li>Analyze borderline cases near threshold - small fixes = big impact</li>
          <li>Export failed traces to CSV and share with engineering team</li>
          <li>Consider threshold calibration based on domain requirements</li>
          <li>Monitor daily/weekly trends to catch degradation early</li>
        </ol>
      </HelpSection>

      <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-blue-600 p-4 rounded-lg mt-6">
        <p className="text-base font-semibold text-blue-600 dark:text-blue-500 mb-1">
          Article 19 Compliance
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          All traces shown in this dashboard are automatically logged per EU AI Act Article 19
          requirements, providing complete audit trail for regulatory review.
        </p>
      </div>
    </div>
  );
}
