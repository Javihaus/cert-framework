"""Quick diagnostic to understand CERT energy scores"""

import sys
sys.path.insert(0, '/Users/javiermarin/cert-framework/packages/python')

from cert import measure

print('='*80)
print('CERT DIAGNOSTIC TEST')
print('='*80)

# Test Case 1: Hypertension
print('\nTest 1: Hypertension Treatment')
print('-'*80)

context1 = 'Thiazide diuretics are first-line therapy for hypertension. Beta blockers are not first-line.'
correct1 = 'Thiazide diuretics are first-line therapy'
incorrect1 = 'Beta blockers are the only first-line therapy'

result_c1 = measure(text1=context1, text2=correct1, use_semantic=True, use_nli=True, use_grounding=True)
result_i1 = measure(text1=context1, text2=incorrect1, use_semantic=True, use_nli=True, use_grounding=True)

energy_c1 = 1.0 - result_c1.confidence
energy_i1 = 1.0 - result_i1.confidence

print(f'Correct energy:   {energy_c1:.4f}')
print(f'Incorrect energy: {energy_i1:.4f}')
print(f'Difference:       {energy_i1 - energy_c1:+.4f}')

if energy_i1 > energy_c1:
    sep = ((energy_i1 - energy_c1) / energy_c1 * 100)
    print(f'✓ Working ({sep:.1f}% separation)')
else:
    print('✗ Not working - incorrect has LOWER energy!')

# Test Case 2: Numeric contradiction
print('\nTest 2: Numeric Values')
print('-'*80)

context2 = 'The revenue was 500 million dollars in Q4 2023.'
correct2 = 'Revenue was 500 million in Q4'
incorrect2 = 'Revenue was 200 million in Q4'

result_c2 = measure(text1=context2, text2=correct2, use_semantic=True, use_nli=True, use_grounding=True)
result_i2 = measure(text1=context2, text2=incorrect2, use_semantic=True, use_nli=True, use_grounding=True)

energy_c2 = 1.0 - result_c2.confidence
energy_i2 = 1.0 - result_i2.confidence

print(f'Correct energy:   {energy_c2:.4f}')
print(f'Incorrect energy: {energy_i2:.4f}')
print(f'Difference:       {energy_i2 - energy_c2:+.4f}')

if energy_i2 > energy_c2:
    sep = ((energy_i2 - energy_c2) / energy_c2 * 100)
    print(f'✓ Working ({sep:.1f}% separation)')
else:
    print('✗ Not working')

# Test Case 3: Clear contradiction
print('\nTest 3: Clear Contradiction')
print('-'*80)

context3 = 'The patient is a 65-year-old male with diabetes.'
correct3 = 'The patient has diabetes'
incorrect3 = 'The patient does not have diabetes'

result_c3 = measure(text1=context3, text2=correct3, use_semantic=True, use_nli=True, use_grounding=True)
result_i3 = measure(text1=context3, text2=incorrect3, use_semantic=True, use_nli=True, use_grounding=True)

energy_c3 = 1.0 - result_c3.confidence
energy_i3 = 1.0 - result_i3.confidence

print(f'Correct energy:   {energy_c3:.4f}')
print(f'Incorrect energy: {energy_i3:.4f}')
print(f'Difference:       {energy_i3 - energy_c3:+.4f}')

if energy_i3 > energy_c3:
    sep = ((energy_i3 - energy_c3) / energy_c3 * 100)
    print(f'✓ Working ({sep:.1f}% separation)')
else:
    print('✗ Not working')

# Summary
print('\n' + '='*80)
print('SUMMARY')
print('='*80)

correct_energies = [energy_c1, energy_c2, energy_c3]
incorrect_energies = [energy_i1, energy_i2, energy_i3]

avg_correct = sum(correct_energies) / len(correct_energies)
avg_incorrect = sum(incorrect_energies) / len(incorrect_energies)
avg_sep = avg_incorrect - avg_correct

print(f'\nAverage correct energy:   {avg_correct:.4f}')
print(f'Average incorrect energy: {avg_incorrect:.4f}')
print(f'Average separation:       {avg_sep:+.4f} ({(avg_sep/avg_correct*100):+.1f}%)')

if avg_sep > 0.15:
    print('\n✓ EXCELLENT separation - CERT is working very well')
    optimal = (avg_correct + avg_incorrect) / 2
    print(f'  Recommended threshold: {optimal:.4f}')
elif avg_sep > 0.05:
    print('\n⚠️  WEAK separation - CERT is barely discriminating')
    print('   Your validation results (50-70% accuracy) match this')
    optimal = (avg_correct + avg_incorrect) / 2
    print(f'  Best threshold: {optimal:.4f} (but expect ~60-70% accuracy)')
else:
    print('\n✗ POOR separation - CERT cannot discriminate reliably')
    print('   This explains the 50% accuracy (random guessing)')

print('\n' + '='*80)
print('INTERPRETATION')
print('='*80)
print(f'\nBased on your validation showing best accuracy at threshold 0.50:')
print(f'  - Your correct answers likely have energy ~0.45-0.48')
print(f'  - Your incorrect answers likely have energy ~0.52-0.55')
print(f'  - This matches WEAK separation (only 0.05-0.10 difference)')
print(f'\nTo improve:')
print(f'  1. Use more extreme contradictions')
print(f'  2. Increase NLI weight in CERT')
print(f'  3. Use shorter, clearer contexts')
