/**
 * Official Membership Plans for Pratyaksh Ayurveda V3
 * Synchronized with backend SQLite database schema and Supabase seed.
 */
export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: 'plan_1m',
    durationMonths: 1,
    duration: '1 Month',
    name: '1 Month Intensive',
    tierCode: '1M',
    price: 1999,
    currency: 'INR',
    badge: 'Rapid Revision',
    description: 'Targeted AIAPGET drill & university semester sprint.'
  },
  {
    id: 'plan_3m',
    durationMonths: 3,
    duration: '3 Months',
    name: '3 Months Foundation',
    tierCode: '3M',
    price: 4999,
    currency: 'INR',
    badge: 'Subject Focus',
    description: 'Comprehensive module coverage across core Samhitas.'
  },
  {
    id: 'plan_6m',
    durationMonths: 6,
    duration: '6 Months',
    name: '6 Months Competitive',
    tierCode: '6M',
    price: 8999,
    currency: 'INR',
    badge: 'Complete Coverage',
    description: 'Deep mastery of Brihattrayi & Laghuttrayi with cumulative mock series.'
  },
  {
    id: 'plan_12m',
    durationMonths: 12,
    duration: '12 Months',
    name: '12 Months Academic Complete',
    tierCode: '12M',
    price: 14999,
    currency: 'INR',
    badge: 'Annual Mastery',
    description: 'Year-round unfettered access with live sync updates.'
  }
];

