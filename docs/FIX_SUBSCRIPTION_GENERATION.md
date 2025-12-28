# Fix Report: Course Generation & Subscription Handling

## Problem Analysis
Users were potentially unable to generate new courses due to a breakdown in the subscription verification logic.
- **Root Cause:** The application assumed that the `plan` field in the user profile would always match the strict `Plan` enum ('Trial', 'Basic', 'Pro').
- **Issue:** If a user had a legacy plan name (e.g., 'premium') or a mismatch in casing, the application would fail to find the pricing configuration, resulting in a `courseLimit` of 0. This effectively blocked the "New Course" button.

## Changes Implemented

### 1. Robust Subscription Validation (`src/contexts/AuthContext.tsx`)
We improved the user profile loading logic to strictly validate the plan against the known `Plan` enum.
- **Before:** Direct cast `(profile.plan as Plan)`.
- **After:** 
  ```typescript
  const isValidPlan = Object.values(Plan).includes(rawPlan as Plan);
  const userPlan = isValidPlan ? (rawPlan as Plan) : Plan.Trial;
  ```
- **Benefit:** If an unknown plan is encountered, the user is safely defaulted to the 'Trial' plan instead of a broken state, ensuring they can at least access the application. A warning is logged to the console.

### 2. Safe Limit Check (`src/pages/DashboardPage.tsx`)
We added a safeguard when accessing `PRICING_PLANS`.
- **Change:** Explicitly check if the plan configuration exists before accessing `courseLimit`.
- **Benefit:** Prevents runtime errors if the plan key is missing from the constants file.

### 3. Legacy Code Analysis
- Reviewed `supabase/functions/generate-course-content/index.ts`.
- Found `getLegacyPrompt` function. This is correctly isolated and only used as a fallback for API calls that lack the modern `step_type` parameter. It does not interfere with new course generation.

## Verification
- **Unit Logic Test:** Verified that invalid plan strings ('premium', 'Gold', null) correctly resolve to 'Trial', while valid plans ('Pro', 'Basic') are preserved.
- **Flow Check:** The `canCreateCourse` variable in `DashboardPage` now relies on a guaranteed valid plan key, ensuring the button state is calculated correctly.

## Recommendations for Future
1. **Database Constraint:** Consider adding a check constraint on the `profiles.plan` column in Postgres to enforce allowed values at the database level.
   ```sql
   ALTER TABLE profiles ADD CONSTRAINT valid_plan CHECK (plan IN ('Trial', 'Basic', 'Pro'));
   ```
2. **Server-Side Validation:** Currently, the limit check is client-side. Implement Row Level Security (RLS) policies or a database trigger to enforce course limits on the backend to prevent API abuse.
