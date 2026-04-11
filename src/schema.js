function createEmptyCvData(language = 'en') {
  return {
    language,
    personal: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: []
  };
}

function validateCvData(data) {
  const errors = [];

  if (!data.language || !['en', 'ar'].includes(data.language)) {
    errors.push('Language must be "en" or "ar"');
  }
  if (!data.personal?.fullName?.trim()) {
    errors.push('Full name is required');
  }
  if (!data.personal?.email?.trim()) {
    errors.push('Email is required');
  }
  if (!data.personal?.phone?.trim()) {
    errors.push('Phone number is required');
  }
  if (!data.summary?.trim()) {
    errors.push('Professional summary is required');
  }
  if (!data.experience || data.experience.length === 0) {
    errors.push('At least one work experience entry is required');
  } else {
    data.experience.forEach((exp, i) => {
      if (!exp.company?.trim()) errors.push(`Experience #${i + 1}: company name is required`);
      if (!exp.role?.trim()) errors.push(`Experience #${i + 1}: role is required`);
      if (!exp.startDate?.trim()) errors.push(`Experience #${i + 1}: start date is required`);
      if (!exp.endDate?.trim()) errors.push(`Experience #${i + 1}: end date is required`);
    });
  }
  if (!data.education || data.education.length === 0) {
    errors.push('At least one education entry is required');
  } else {
    data.education.forEach((edu, i) => {
      if (!edu.institution?.trim()) errors.push(`Education #${i + 1}: institution is required`);
      if (!edu.degree?.trim()) errors.push(`Education #${i + 1}: degree is required`);
    });
  }
  if (!data.skills || data.skills.length === 0) {
    errors.push('At least one skill is required');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { createEmptyCvData, validateCvData };
