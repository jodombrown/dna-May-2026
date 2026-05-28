import { OnboardingFormData } from '../hooks/useOnboardingForm';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateIdentityStep = (data: Partial<OnboardingFormData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.first_name?.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  } else if (data.first_name.trim().length < 2) {
    errors.push({ field: 'first_name', message: 'First name must be at least 2 characters' });
  }

  if (!data.last_name?.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  } else if (data.last_name.trim().length < 2) {
    errors.push({ field: 'last_name', message: 'Last name must be at least 2 characters' });
  }

  if (!data.avatar_url?.trim()) {
    errors.push({ field: 'avatar_url', message: 'Profile photo is required' });
  }

  // current_country is collected in Step 6 (Place) — not required here

  // Professional headline is optional but validate length if provided
  if (data.headline?.trim() && data.headline.trim().length > 200) {
    errors.push({ field: 'headline', message: 'Headline must be less than 200 characters' });
  }

  return errors;
};

// Username validation for step 2
export const validateUsernameStep = (data: Partial<OnboardingFormData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.username?.trim()) {
    errors.push({ field: 'username', message: 'Please choose a username' });
  } else if (data.username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
  } else if (data.username.trim().length > 20) {
    errors.push({ field: 'username', message: 'Username must be less than 20 characters' });
  } else if (!/^[a-z0-9._-]+$/.test(data.username.trim())) {
    errors.push({ field: 'username', message: 'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens' });
  }

  return errors;
};

// Professional fields are now optional - deferred to in-app completion
export const validateProfessionalStep = (data: Partial<OnboardingFormData>): ValidationError[] => {
  return []; // All fields optional - deferred to profile completion
};

// Discovery step has no required fields - all optional
export const validateDiscoveryStep = (data: Partial<OnboardingFormData>): ValidationError[] => {
  return []; // No validation needed - all fields optional
};

export const validateStep = (step: number, data: Partial<OnboardingFormData>): ValidationError[] => {
  switch (step) {
    case 0:
      return validateIdentityStep(data);
    case 1:
      return validateDiscoveryStep(data); // Optional step
    case 2:
      return validateUsernameStep(data);
    default:
      return [];
  }
};
