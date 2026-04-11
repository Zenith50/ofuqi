const { input, select, confirm } = require('@inquirer/prompts');
const { createEmptyCvData } = require('./schema');
const path = require('path');

function loadLocale(lang) {
  return require(path.join(__dirname, 'i18n', `${lang}.json`));
}

async function collectCvData() {
  const language = await select({
    message: 'Select CV language / اختر لغة السيرة الذاتية',
    choices: [
      { name: 'English', value: 'en' },
      { name: 'العربية (Arabic)', value: 'ar' }
    ]
  });

  const t = loadLocale(language);
  const data = createEmptyCvData(language);

  console.log('\n--- ' + (language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information') + ' ---\n');

  data.personal.fullName = await input({ message: t.prompts.fullName, required: true });
  data.personal.jobTitle = await input({ message: t.prompts.jobTitle });
  data.personal.email = await input({ message: t.prompts.emailAddress, required: true });
  data.personal.phone = await input({ message: t.prompts.phoneNumber, required: true });
  data.personal.location = await input({ message: t.prompts.locationCity });
  data.personal.linkedin = await input({ message: t.prompts.linkedinUrl });
  data.personal.website = await input({ message: t.prompts.websiteUrl });

  console.log('\n--- ' + t.sections.summary + ' ---\n');
  data.summary = await input({ message: t.prompts.summaryText, required: true });

  console.log('\n--- ' + t.sections.experience + ' ---\n');
  let addExp = await confirm({ message: t.prompts.addExperience, default: true });
  while (addExp) {
    const exp = {
      company: await input({ message: t.prompts.companyName, required: true }),
      role: await input({ message: t.prompts.roleTitle, required: true }),
      startDate: await input({ message: t.prompts.startDate, required: true }),
      endDate: await input({ message: t.prompts.endDate, required: true }),
      achievements: []
    };

    let bullet = await input({ message: t.prompts.achievement });
    while (bullet.trim()) {
      exp.achievements.push(bullet.trim());
      bullet = await input({ message: t.prompts.achievement });
    }

    data.experience.push(exp);
    addExp = await confirm({ message: t.prompts.addMoreExperience, default: false });
  }

  console.log('\n--- ' + t.sections.education + ' ---\n');
  let addEdu = await confirm({ message: t.prompts.addEducation, default: true });
  while (addEdu) {
    const edu = {
      institution: await input({ message: t.prompts.institution, required: true }),
      degree: await input({ message: t.prompts.degree, required: true }),
      startDate: await input({ message: t.prompts.eduStartDate }),
      endDate: await input({ message: t.prompts.eduEndDate }),
      details: await input({ message: t.prompts.eduDetails })
    };
    data.education.push(edu);
    addEdu = await confirm({ message: t.prompts.addMoreEducation, default: false });
  }

  console.log('\n--- ' + t.sections.skills + ' ---\n');
  const skillsRaw = await input({ message: t.prompts.skillsInput, required: true });
  data.skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

  console.log('\n--- ' + t.sections.certifications + ' ---\n');
  let addCert = await confirm({ message: t.prompts.addCertifications, default: false });
  while (addCert) {
    const cert = {
      name: await input({ message: t.prompts.certName, required: true }),
      issuer: await input({ message: t.prompts.certIssuer }),
      date: await input({ message: t.prompts.certDate })
    };
    data.certifications.push(cert);
    addCert = await confirm({ message: t.prompts.addMoreCerts, default: false });
  }

  console.log('\n--- ' + t.sections.languages + ' ---\n');
  let addLang = await confirm({ message: t.prompts.addLanguages, default: false });
  while (addLang) {
    const lang = {
      name: await input({ message: t.prompts.langName, required: true }),
      level: await select({
        message: t.prompts.langLevel,
        choices: Object.entries(t.proficiency).map(([, val]) => ({ name: val, value: val }))
      })
    };
    data.languages.push(lang);
    addLang = await confirm({ message: t.prompts.addMoreLangs, default: false });
  }

  return data;
}

module.exports = { collectCvData, loadLocale };
