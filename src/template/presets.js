const TEMPLATE_PRESETS = {
  ats: {
    key: 'ats',
    docx: {
      headingFont: 'Arial',
      bodyFont: 'Arial',
      headerAlignment: 'CENTER',
      dividerColor: 'CCCCCC',
      nameColor: '000000',
      roleColor: '666666',
      sectionColor: '111111'
    },
    pdf: {
      headingFont: 'HelveticaBold',
      bodyFont: 'Helvetica',
      headerAlign: 'center',
      dividerColor: 'CCCCCC',
      nameColor: '000000',
      roleColor: '666666',
      sectionColor: '111111'
    },
    htmlClass: 'template-ats'
  },
  harvard: {
    key: 'harvard',
    docx: {
      headingFont: 'Times New Roman',
      bodyFont: 'Times New Roman',
      headerAlignment: 'LEFT',
      dividerColor: '8F7D6C',
      nameColor: '1A1713',
      roleColor: '685748',
      sectionColor: '433324'
    },
    pdf: {
      headingFont: 'TimesRomanBold',
      bodyFont: 'TimesRoman',
      headerAlign: 'left',
      dividerColor: '8F7D6C',
      nameColor: '1A1713',
      roleColor: '685748',
      sectionColor: '433324'
    },
    htmlClass: 'template-harvard'
  },
  ada: {
    key: 'ada',
    docx: {
      headingFont: 'Arial',
      bodyFont: 'Arial',
      headerAlignment: 'LEFT',
      dividerColor: 'CFDCE0',
      nameColor: '0F2630',
      roleColor: '35535B',
      sectionColor: '15313A',
      sidebarBackground: '12313A',
      sidebarText: 'EEF7F8'
    },
    pdf: {
      headingFont: 'HelveticaBold',
      bodyFont: 'Helvetica',
      headerAlign: 'left',
      dividerColor: 'CFDCE0',
      nameColor: '0F2630',
      roleColor: '35535B',
      sectionColor: '15313A',
      sidebarBackground: '12313A',
      sidebarText: 'EEF7F8'
    },
    htmlClass: 'template-ada'
  }
};

const TEMPLATE_ALIASES = {
  monolith: 'harvard',
  berlin: 'ats',
  studio: 'ada',
  ats3: 'ats'
};

function resolveTemplateKey(value) {
  if (!value) {
    return 'ats';
  }

  const normalized = String(value).trim().toLowerCase();
  return TEMPLATE_PRESETS[normalized] ? normalized : (TEMPLATE_ALIASES[normalized] || 'ats');
}

function getTemplatePreset(value) {
  return TEMPLATE_PRESETS[resolveTemplateKey(value)];
}

module.exports = {
  TEMPLATE_PRESETS,
  getTemplatePreset,
  resolveTemplateKey
};
