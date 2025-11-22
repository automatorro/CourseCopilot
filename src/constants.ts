import { Plan } from './types';

// =================================================================================
// IMPORTANT: ACTION REQUIRED!
// You must replace these placeholder values with your actual keys from Stripe.
// Find these in your Stripe Dashboard.
// =================================================================================

// 1. Get your Publishable Key from Stripe and paste it here.
// Found under "Developers" -> "API keys". It starts with 'pk_'.
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RDo9eAQ5UIM4NTrKhUbClXAsSxYvaVINv4ysWXEedQjQtoOFP7FmQq2RirQRRP9UcnnzLXkpbWAdH7LVuUAjuf6001C7dDiTL';

export const PRICING_PLANS = {
  [Plan.Trial]: {
    name: Plan.Trial,
    price: 0,
    courseLimit: 1,
    duration: '3 days',
    featuresKey: 'trialFeatures',
  },
  [Plan.Basic]: {
    name: Plan.Basic,
    price: 9,
    courseLimit: 3,
    duration: '/month',
    featuresKey: 'basicFeatures',
    // 2. Get your Price ID for the Basic plan from Stripe and paste it here.
    // In Stripe, go to Products -> Select your plan -> Find the Price ID in the "Pricing" section.
    // It MUST start with 'price_'.
    priceId: 'price_1RYglnAQ5UIM4NTryLd6kjMP',
  },
  [Plan.Pro]: {
    name: Plan.Pro,
    price: 29,
    courseLimit: 20,
    duration: '/month',
    featuresKey: 'proFeatures',
    // 3. Get your Price ID for the Pro plan from Stripe and paste it here.
    // In Stripe, go to Products -> Select your plan -> Find the Price ID in the "Pricing" section.
    // It MUST start with 'price_'.
    priceId: 'price_1RYgnmAQ5UIM4NTrOnMTgtkt',
  },
};

export const COURSE_STEPS_KEYS = [
  'course.steps.structure',
  'course.steps.slides',
  'course.steps.exercises',
  'course.steps.manual',
  'course.steps.tests',
];

export const LIVE_WORKSHOP_STEPS = [
  'course.steps.structure',
  'course.steps.slides',
  'course.steps.exercises',
  'course.steps.manual',
  'course.steps.tests',
];

export const ONLINE_COURSE_STEPS = [
  'course.steps.structure',
  'course.steps.video_scripts',
  'course.steps.projects',
  'course.steps.cheat_sheets',
  'course.steps.tests',
];

export const CONTENT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ro', name: 'Română' },
];