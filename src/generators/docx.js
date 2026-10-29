const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  TabStopPosition,
  LevelFormat,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} = require('docx');
const { COLORS, FONT_SIZES, SPACING, PAGE, DIRECTION } = require('../template/styles');
const { getTemplatePreset, resolveTemplateKey } = require('../template/presets');

function formatLanguageLabel(language) {
  const name = language && language.name ? language.name : '';
  if (!language || language.level == null || language.level === '') {
    return name;
  }
  return name + ' (' + language.level + ')';
}

async function generateDocx(data, locale, outputPath, templateKey = 'ats') {
  data = {
    ...data,
    experience: data.experience || [],
    education: data.education || [],
    skills: data.skills || []
  };
  const preset = getTemplatePreset(resolveTemplateKey(templateKey));
  const isArabic = data.language === 'ar';
  const dir = DIRECTION[data.language];
  const align = AlignmentType[dir.align];
  const headerAlignment = preset.key === 'ats' ? AlignmentType.CENTER : align;
  const bodyFont = isArabic ? 'Arial' : preset.docx.bodyFont;
  const headingFont = isArabic ? 'Arial' : preset.docx.headingFont;

  function makeFont(fontName) {
    if (isArabic) {
      return { ascii: fontName, hAnsi: fontName, cs: fontName, eastAsia: fontName };
    }
    return fontName;
  }

  function makeRun(text, opts = {}) {
    const run = {
      text,
      font: makeFont(opts.fontName || bodyFont),
      size: opts.size || FONT_SIZES.body.docx,
      color: opts.color || COLORS.darkGray,
      rightToLeft: dir.rtl,
      ...opts
    };

    if (isArabic) {
      if (run.bold) run.boldComplexScript = true;
      if (run.italics) run.italicsComplexScript = true;
      run.sizeComplexScript = run.size;
      run.font = makeFont(opts.fontName || bodyFont);
    }

    delete run.fontName;
    return new TextRun(run);
  }

  function makeParagraph(opts) {
    return new Paragraph({
      alignment: opts.alignment || align,
      ...opts
    });
  }

  function createSectionHeading(text, options = {}) {
    const headingText = !isArabic && options.uppercase ? text.toUpperCase() : text;
    const run = {
      text: headingText,
      bold: true,
      size: FONT_SIZES.sectionHead.docx,
      font: makeFont(options.fontName || headingFont),
      color: options.color || preset.docx.sectionColor,
      rightToLeft: dir.rtl
    };

    if (isArabic) {
      run.boldComplexScript = true;
      run.sizeComplexScript = FONT_SIZES.sectionHead.docx;
    }

    return new Paragraph({
      alignment: options.alignment || align,
      spacing: { before: SPACING.sectionGap.docx, after: SPACING.afterHeading.docx },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: options.borderColor || preset.docx.dividerColor,
          space: 4
        }
      },
      children: [new TextRun(run)]
    });
  }

  function createSpacer() {
    return new Paragraph({
      spacing: { before: 50, after: 50 },
      children: []
    });
  }

  const bulletConfig = {
    reference: 'cv-bullets',
    levels: [{
      level: 0,
      format: LevelFormat.BULLET,
      text: '\u2022',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: SPACING.bulletIndent.docx + 360, hanging: SPACING.bulletIndent.docx }
        }
      }
    }]
  };

  const children = [];

  children.push(makeParagraph({
    alignment: headerAlignment,
    spacing: { after: 60 },
    children: [
      makeRun(data.personal.fullName, {
        bold: true,
        size: FONT_SIZES.name.docx,
        fontName: headingFont,
        color: preset.docx.nameColor
      })
    ]
  }));

  if (data.personal.jobTitle) {
    children.push(makeParagraph({
      alignment: headerAlignment,
      spacing: { after: 80 },
      children: [
        makeRun(data.personal.jobTitle, {
          size: FONT_SIZES.jobTitle.docx,
          color: preset.docx.roleColor
        })
      ]
    }));
  }

  const contactParts = [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.linkedin,
    data.personal.website
  ].filter(Boolean);

  if (contactParts.length > 0 && preset.key !== 'ada') {
    children.push(makeParagraph({
      alignment: headerAlignment,
      spacing: { after: 120 },
      children: [
        makeRun(contactParts.join(SPACING.contactSeparator), {
          size: FONT_SIZES.small.docx,
          color: COLORS.darkGray
        })
      ]
    }));
  }

  if (preset.key !== 'ada') {
    children.push(createSpacer());
  }

  const experienceSection = [];
  const educationSection = [];

  if (preset.key !== 'ada' && data.summary) {
    children.push(createSectionHeading(locale.sections.summary, { uppercase: preset.key === 'ats' }));
    children.push(makeParagraph({
      spacing: { after: SPACING.lineSpacing.docx },
      children: [makeRun(data.summary)]
    }));
    children.push(createSpacer());
  }

  if (data.experience.length > 0) {
    experienceSection.push(createSectionHeading(locale.sections.experience, { uppercase: preset.key === 'ats' }));

    data.experience.forEach((experience, index) => {
      if (isArabic) {
        experienceSection.push(makeParagraph({
          spacing: { before: index > 0 ? 160 : 0, after: 0 },
          children: [
            makeRun(experience.role, { bold: true, fontName: headingFont, color: preset.docx.nameColor })
          ]
        }));

        const dateText = [experience.startDate, experience.endDate].filter(Boolean).join(' - ');
        if (dateText) {
          experienceSection.push(makeParagraph({
            spacing: { after: 0 },
            children: [makeRun(dateText, { size: FONT_SIZES.small.docx, color: preset.docx.roleColor })]
          }));
        }

        experienceSection.push(makeParagraph({
          spacing: { after: 30 },
          children: [makeRun(experience.company)]
        }));
      } else {
        const separator = preset.key === 'harvard' ? '  ·  ' : '  |  ';
        experienceSection.push(new Paragraph({
          alignment: align,
          spacing: { before: index > 0 ? 160 : 0, after: 40 },
          tabStops: [{
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX
          }],
          children: [
            new TextRun({
              text: experience.role,
              bold: true,
              size: FONT_SIZES.body.docx,
              font: headingFont,
              color: preset.docx.nameColor
            }),
            new TextRun({
              text: separator + experience.company,
              size: FONT_SIZES.body.docx,
              font: bodyFont,
              color: COLORS.darkGray
            }),
            new TextRun({
              text: '\t' + [experience.startDate, experience.endDate].filter(Boolean).join(' - '),
              size: FONT_SIZES.small.docx,
              font: bodyFont,
              color: preset.docx.roleColor
            })
          ]
        }));
      }

      (experience.achievements || []).forEach(achievement => {
        if (isArabic) {
          experienceSection.push(makeParagraph({
            spacing: { after: 30 },
            indent: { right: 720, hanging: 360 },
            children: [makeRun('\u2022  ' + achievement)]
          }));
        } else {
          experienceSection.push(new Paragraph({
            alignment: align,
            numbering: { reference: 'cv-bullets', level: 0 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: achievement,
                size: FONT_SIZES.body.docx,
                font: bodyFont,
                color: COLORS.darkGray
              })
            ]
          }));
        }
      });
    });

    experienceSection.push(createSpacer());
  }

  if (data.education.length > 0) {
    educationSection.push(createSectionHeading(locale.sections.education, { uppercase: preset.key === 'ats' }));

    data.education.forEach((education, index) => {
      if (isArabic) {
        educationSection.push(makeParagraph({
          spacing: { before: index > 0 ? 160 : 0, after: 0 },
          children: [
            makeRun(education.degree, { bold: true, fontName: headingFont, color: preset.docx.nameColor })
          ]
        }));

        const dateText = [education.startDate, education.endDate].filter(Boolean).join(' - ');
        if (dateText) {
          educationSection.push(makeParagraph({
            spacing: { after: 0 },
            children: [makeRun(dateText, { size: FONT_SIZES.small.docx, color: preset.docx.roleColor })]
          }));
        }

        educationSection.push(makeParagraph({
          spacing: { after: 30 },
          children: [makeRun(education.institution)]
        }));
      } else {
        const separator = preset.key === 'harvard' ? '  ·  ' : '  |  ';
        educationSection.push(new Paragraph({
          alignment: align,
          spacing: { before: index > 0 ? 160 : 0, after: 40 },
          tabStops: [{
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX
          }],
          children: [
            new TextRun({
              text: education.degree,
              bold: true,
              size: FONT_SIZES.body.docx,
              font: headingFont,
              color: preset.docx.nameColor
            }),
            new TextRun({
              text: separator + education.institution,
              size: FONT_SIZES.body.docx,
              font: bodyFont,
              color: COLORS.darkGray
            }),
            ...(education.startDate || education.endDate ? [new TextRun({
              text: '\t' + [education.startDate, education.endDate].filter(Boolean).join(' - '),
              size: FONT_SIZES.small.docx,
              font: bodyFont,
              color: preset.docx.roleColor
            })] : [])
          ]
        }));
      }

      if (education.details) {
        educationSection.push(makeParagraph({
          spacing: { after: 30 },
          indent: isArabic ? { right: 360 } : { left: 360 },
          children: [
            makeRun(education.details, {
              size: FONT_SIZES.small.docx,
              color: preset.docx.roleColor,
              italics: true
            })
          ]
        }));
      }
    });

    educationSection.push(createSpacer());
  }

  if (preset.key === 'ada') {
    children.push(createAdaOverviewTable({
      align,
      bodyFont,
      contactParts,
      data,
      headingFont,
      isArabic,
      locale,
      mainSections: experienceSection.concat(educationSection),
      makeFont,
      makeParagraph,
      makeRun,
      preset
    }));
    children.push(createSpacer());
  } else {
    experienceSection.forEach(block => children.push(block));
    educationSection.forEach(block => children.push(block));
  }

  if (preset.key !== 'ada' && data.skills.length > 0) {
    children.push(createSectionHeading(locale.sections.skills, { uppercase: preset.key === 'ats' }));
    children.push(makeParagraph({
      spacing: { after: SPACING.lineSpacing.docx },
      children: [makeRun(data.skills.join('  \u2022  '))]
    }));
    children.push(createSpacer());
  }

  if (preset.key !== 'ada' && data.certifications && data.certifications.length > 0) {
    children.push(createSectionHeading(locale.sections.certifications, { uppercase: preset.key === 'ats' }));
    data.certifications.forEach(certification => {
      const parts = [certification.name];
      if (certification.issuer) parts.push(certification.issuer);
      if (certification.date) parts.push(certification.date);
      const text = parts.filter(Boolean).join(' - ');

      if (isArabic) {
        children.push(makeParagraph({
          spacing: { after: 30 },
          indent: { right: 720, hanging: 360 },
          children: [makeRun('\u2022  ' + text)]
        }));
      } else {
        children.push(new Paragraph({
          alignment: align,
          numbering: { reference: 'cv-bullets', level: 0 },
          spacing: { after: 30 },
          children: [
            new TextRun({
              text,
              size: FONT_SIZES.body.docx,
              font: bodyFont,
              color: COLORS.darkGray
            })
          ]
        }));
      }
    });
    children.push(createSpacer());
  }

  if (preset.key !== 'ada' && data.languages && data.languages.length > 0) {
    children.push(createSectionHeading(locale.sections.languages, { uppercase: preset.key === 'ats' }));
    children.push(makeParagraph({
      spacing: { after: SPACING.lineSpacing.docx },
      children: [
        makeRun(data.languages.map(language => formatLanguageLabel(language)).filter(Boolean).join('  \u2022  '))
      ]
    }));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: makeFont(bodyFont),
            size: FONT_SIZES.body.docx,
            ...(isArabic ? { sizeComplexScript: FONT_SIZES.body.docx } : {})
          }
        }
      }
    },
    numbering: { config: [bulletConfig] },
    sections: [{
      properties: {
        page: {
          margin: PAGE.margin.docx,
          size: {
            width: PAGE.a4.docx.width,
            height: PAGE.a4.docx.height
          }
        }
      },
      children
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function createAdaOverviewTable({
  align,
  bodyFont,
  contactParts,
  data,
  headingFont,
  isArabic,
  locale,
  mainSections,
  makeParagraph,
  makeRun,
  preset
}) {
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  };

  const sidebarTextColor = preset.docx.sidebarText || 'EEF7F8';
  const sidebarFill = preset.docx.sidebarBackground || '12313A';
  const sidebarChildren = [];
  const mainChildren = [];

  if (contactParts.length > 0) {
    sidebarChildren.push(createSidebarHeading(locale, 'contact', isArabic, makeParagraph, makeRun, sidebarTextColor, headingFont));
    contactParts.forEach(item => {
      sidebarChildren.push(makeParagraph({
        spacing: { after: 35 },
        children: [makeRun(item, { size: FONT_SIZES.small.docx, color: sidebarTextColor, fontName: bodyFont })]
      }));
    });
  }

  if (data.skills.length > 0) {
    sidebarChildren.push(createSidebarHeading(locale, 'skills', isArabic, makeParagraph, makeRun, sidebarTextColor, headingFont));
    sidebarChildren.push(makeParagraph({
      spacing: { after: 40 },
      children: [makeRun(data.skills.join('  \u2022  '), { color: sidebarTextColor, fontName: bodyFont })]
    }));
  }

  if (data.certifications && data.certifications.length > 0) {
    sidebarChildren.push(createSidebarHeading(locale, 'certifications', isArabic, makeParagraph, makeRun, sidebarTextColor, headingFont));
    data.certifications.forEach(certification => {
      const parts = [certification.name];
      if (certification.issuer) parts.push(certification.issuer);
      if (certification.date) parts.push(certification.date);
      sidebarChildren.push(makeParagraph({
        spacing: { after: 35 },
        indent: isArabic ? { right: 420, hanging: 220 } : { left: 420, hanging: 220 },
        children: [makeRun('\u2022  ' + parts.join(' - '), { color: sidebarTextColor, fontName: bodyFont })]
      }));
    });
  }

  if (data.languages && data.languages.length > 0) {
    sidebarChildren.push(createSidebarHeading(locale, 'languages', isArabic, makeParagraph, makeRun, sidebarTextColor, headingFont));
    sidebarChildren.push(makeParagraph({
      spacing: { after: 20 },
      children: [
        makeRun(
          data.languages.map(language => formatLanguageLabel(language)).filter(Boolean).join('  \u2022  '),
          { color: sidebarTextColor, fontName: bodyFont }
        )
      ]
    }));
  }

  if (data.summary) {
    mainChildren.push(new Paragraph({
      alignment: align,
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: preset.docx.dividerColor,
          space: 4
        }
      },
      spacing: { after: 120 },
      children: [
        makeRun(locale.sections.summary, {
          bold: true,
          size: FONT_SIZES.sectionHead.docx,
          fontName: headingFont,
          color: preset.docx.sectionColor
        })
      ]
    }));
    mainChildren.push(makeParagraph({
      spacing: { after: 40 },
      children: [makeRun(data.summary, { fontName: bodyFont })]
    }));
  }

  (mainSections || []).forEach(section => {
    mainChildren.push(section);
  });

  const sidebarCell = new TableCell({
    width: { size: 34, type: WidthType.PERCENTAGE },
    shading: { fill: sidebarFill },
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    borders: noBorders,
    children: sidebarChildren.length > 0 ? sidebarChildren : [new Paragraph({ children: [] })]
  });

  const mainCell = new TableCell({
    width: { size: 66, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    borders: noBorders,
    children: mainChildren.length > 0 ? mainChildren : [new Paragraph({ children: [] })]
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [34, 66],
    borders: noBorders,
    rows: [
      new TableRow({
        children: isArabic ? [mainCell, sidebarCell] : [sidebarCell, mainCell]
      })
    ]
  });
}

function createSidebarHeading(locale, key, isArabic, makeParagraph, makeRun, color, headingFont) {
  const label = key === 'contact'
    ? (isArabic ? 'التواصل' : 'Contact')
    : locale.sections[key];

  return makeParagraph({
    spacing: { before: 60, after: 30 },
    children: [
      makeRun(label, {
        bold: true,
        size: FONT_SIZES.sectionHead.docx - 2,
        fontName: headingFont,
        color
      })
    ]
  });
}

module.exports = { generateDocx };
