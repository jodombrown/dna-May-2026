// Helper functions for ProfileForm security enhancements

export const getFieldMaxLength = (fieldName: string): number => {
  const fieldLimits: Record<string, number> = {
    full_name: 100,
    profession: 100,
    company: 100,
    location: 100,
    bio: 1000,
    primary_origin_country: 50,
    current_country: 50,
    linkedin_url: 200
  };

  return fieldLimits[fieldName] || 100;
};

export const shouldRemoveUrls = (fieldName: string): boolean => {
  // Remove URLs from fields that shouldn't contain them
  const urlRestrictedFields = ['full_name', 'profession', 'company'];
  return urlRestrictedFields.includes(fieldName);
};