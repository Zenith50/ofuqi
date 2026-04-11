const COLORS = {
  black: '000000',
  darkGray: '333333',
  mediumGray: '666666',
  lightGray: '999999',
  lineGray: 'CCCCCC',
  white: 'FFFFFF'
};

const FONT_SIZES = {
  name: { docx: 48, pdf: 24 },
  jobTitle: { docx: 24, pdf: 12 },
  sectionHead: { docx: 26, pdf: 13 },
  body: { docx: 22, pdf: 11 },
  small: { docx: 20, pdf: 10 },
  tiny: { docx: 18, pdf: 9 }
};

const FONTS = {
  en: {
    heading: 'Arial',
    body: 'Arial'
  },
  ar: {
    heading: 'Arial',
    body: 'Arial'
  }
};

const PDF_FONTS = {
  regular: 'fonts/Amiri-Regular.ttf',
  bold: 'fonts/Amiri-Bold.ttf'
};

const SPACING = {
  sectionGap: { docx: 240, pdf: 18 },
  afterHeading: { docx: 120, pdf: 6 },
  lineSpacing: { docx: 60, pdf: 4 },
  bulletIndent: { docx: 360, pdf: 15 },
  contactSeparator: '  |  '
};

const PAGE = {
  a4: {
    pdf: { width: 595.28, height: 841.89 },
    docx: { width: 11906, height: 16838 }
  },
  margin: {
    pdf: { top: 50, right: 50, bottom: 50, left: 50 },
    docx: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
  }
};

const DIRECTION = {
  en: { align: 'LEFT', bidi: false, rtl: false },
  ar: { align: 'RIGHT', bidi: true, rtl: true }
};

const DIVIDER = {
  color: COLORS.lineGray,
  thickness: { docx: 1, pdf: 0.75 }
};

module.exports = {
  COLORS,
  FONT_SIZES,
  FONTS,
  PDF_FONTS,
  SPACING,
  PAGE,
  DIRECTION,
  DIVIDER
};
