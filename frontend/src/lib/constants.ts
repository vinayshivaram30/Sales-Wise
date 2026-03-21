export const MEDDIC_LABELS: Record<string, string> = {
  metrics: 'Metrics',
  econ_buyer: 'Economic Buyer',
  decision_criteria: 'Decision Criteria',
  decision_process: 'Decision Process',
  pain: 'Pain',
  champion: 'Champion',
};

export const SPIN_LABELS: Record<string, string> = {
  situation: 'Situation',
  problem: 'Problem',
  implication: 'Implication',
  need_payoff: 'Need-Payoff',
};

export const BANT_LABELS: Record<string, string> = {
  budget: 'Budget',
  authority: 'Authority',
  need: 'Need',
  timeline: 'Timeline',
};

export const FRAMEWORK_LABELS: Record<string, Record<string, string>> = {
  MEDDIC: MEDDIC_LABELS,
  SPIN: SPIN_LABELS,
  BANT: BANT_LABELS,
};

export const FRAMEWORKS = ['MEDDIC', 'SPIN', 'BANT'] as const;
export type Framework = typeof FRAMEWORKS[number];
