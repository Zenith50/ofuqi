const fs = require('fs');
const path = require('path');
const { PDF_FONTS } = require('../template/styles');
const { getTextDirection } = require('../template/bidi');
const { getTemplatePreset, resolveTemplateKey } = require('../template/presets');

async function generatePdf(data, locale, outputPath, templateKey = 'ats') {
  const resolvedTemplateKey = resolveTemplateKey(templateKey);
  const templatePreset = getTemplatePreset(resolvedTemplateKey);
  const html = buildPdfHtml(data, locale, templatePreset);

  let browser;

  try {
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      const puppeteerModule = await import('puppeteer-core');
      const chromiumModule = await import('@sparticuz/chromium-min');
      const puppeteer = puppeteerModule.default ?? puppeteerModule;
      const chromium = chromiumModule.default ?? chromiumModule;

      browser = await puppeteer.launch({
        args: [...chromium.args, '--hide-scrollbars', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
          'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
        ),
        headless: chromium.headless,
      });
    } else {
      const puppeteerModule = await import('puppeteer');
      const puppeteer = puppeteerModule.default ?? puppeteerModule;
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        timeout: 120000,
        protocolTimeout: 120000
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true
    });

    fs.writeFileSync(outputPath, pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return outputPath;
}

function buildPdfHtml(data, locale, templatePreset) {
  const templateFileName = data.language === 'ar' ? 'cv-template-ar.html' : 'cv-template-en.html';
  // Vercel serverless functions require absolute paths via process.cwd()
  const templatePath = path.join(process.cwd(), 'src', 'template', templateFileName);
  
  let html = fs.readFileSync(templatePath, 'utf-8');
  html = injectFontPaths(html);

  const contactParts = getContactParts(data);
  const isAda = templatePreset.key === 'ada';
  const isSingle = !isAda;

  html = html.replace(/\{\{templateClass\}\}/g, templatePreset.htmlClass);
  html = html.replace(/\{\{fullName\}\}/g, escapeHtml(data.personal.fullName));
  html = html.replace(/\{\{sectionSummary\}\}/g, escapeHtml(locale.sections.summary));
  html = html.replace(/\{\{sectionExperience\}\}/g, escapeHtml(locale.sections.experience));
  html = html.replace(/\{\{sectionEducation\}\}/g, escapeHtml(locale.sections.education));
  html = html.replace(/\{\{sectionSkills\}\}/g, escapeHtml(locale.sections.skills));
  html = html.replace(/\{\{sectionCertifications\}\}/g, escapeHtml(locale.sections.certifications));
  html = html.replace(/\{\{sectionLanguages\}\}/g, escapeHtml(locale.sections.languages));
  html = html.replace(/\{\{sectionContact\}\}/g, escapeHtml(data.language === 'ar' ? 'التواصل' : 'Contact'));

  html = replaceConditionalBlock(html, 'jobTitle', Boolean(data.personal.jobTitle));
  html = html.replace(/\{\{jobTitle\}\}/g, escapeHtml(data.personal.jobTitle || ''));

  html = replaceConditionalBlock(html, 'showContactLine', contactParts.length > 0 && isSingle);
  html = replaceConditionalBlock(html, 'hasContactStack', contactParts.length > 0 && isAda);
  html = html.replace(
    /\{\{contactLineHtml\}\}/g,
    buildSeparatedHtml(contactParts, {
      itemClass: 'contact-item',
      separatorClass: 'contact-separator',
      separatorText: '|'
    })
  );
  html = html.replace(/\{\{contactStackHtml\}\}/g, buildStackHtml(contactParts));

  html = replaceConditionalBlock(html, 'isSingle', isSingle);
  html = replaceConditionalBlock(html, 'isAda', isAda);
  html = replaceConditionalBlock(html, 'summary', Boolean(data.summary));
  html = html.replace(/\{\{summary\}\}/g, escapeHtml(data.summary || ''));

  html = replaceConditionalBlock(html, 'hasExperience', data.experience && data.experience.length > 0);
  html = replaceLoopBlock(html, 'experience', data.experience || [], (block, item) => {
    let nextBlock = block;
    nextBlock = nextBlock.replace(/\{\{role\}\}/g, escapeHtml(item.role));
    nextBlock = nextBlock.replace(/\{\{company\}\}/g, escapeHtml(item.company));
    nextBlock = nextBlock.replace(
      /\{\{dateRange\}\}/g,
      escapeHtml([item.startDate, item.endDate].filter(Boolean).join(' - '))
    );

    nextBlock = replaceConditionalBlock(nextBlock, 'hasAchievements', item.achievements && item.achievements.length > 0);
    nextBlock = replaceLoopBlock(nextBlock, 'achievements', item.achievements || [], (achievementBlock, achievement) =>
      achievementBlock.replace(/\{\{\.\}\}/g, escapeHtml(achievement))
    );
    return nextBlock;
  });

  html = replaceConditionalBlock(html, 'hasEducation', data.education && data.education.length > 0);
  html = replaceLoopBlock(html, 'education', data.education || [], (block, item) => {
    let nextBlock = block;
    const dateStr = [item.startDate, item.endDate].filter(Boolean).join(' - ');

    nextBlock = nextBlock.replace(/\{\{degree\}\}/g, escapeHtml(item.degree));
    nextBlock = nextBlock.replace(/\{\{institution\}\}/g, escapeHtml(item.institution));
    nextBlock = replaceConditionalBlock(nextBlock, 'dateStr', Boolean(dateStr));
    nextBlock = nextBlock.replace(/\{\{dateStr\}\}/g, escapeHtml(dateStr));
    nextBlock = replaceConditionalBlock(nextBlock, 'details', Boolean(item.details));
    nextBlock = nextBlock.replace(/\{\{details\}\}/g, escapeHtml(item.details || ''));
    return nextBlock;
  });

  html = replaceConditionalBlock(html, 'hasSkills', data.skills && data.skills.length > 0);
  html = html.replace(
    /\{\{skillsHtml\}\}/g,
    buildSeparatedHtml(data.skills || [], {
      itemClass: 'inline-item',
      separatorClass: 'inline-separator',
      separatorText: '\u2022'
    })
  );

  const certificationItems = (data.certifications || []).map(certification => {
    const parts = [certification.name];
    if (certification.issuer) parts.push(certification.issuer);
    if (certification.date) parts.push(certification.date);
    return parts.join(' - ');
  });
  html = replaceConditionalBlock(html, 'hasCertifications', certificationItems.length > 0);
  html = replaceLoopBlock(html, 'certifications', certificationItems, (block, item) =>
    block.replace(/\{\{\.\}\}/g, escapeHtml(item))
  );

  const languageItems = (data.languages || []).map(language => `${language.name} (${language.level})`);
  html = replaceConditionalBlock(html, 'hasLanguages', languageItems.length > 0);
  html = html.replace(
    /\{\{languagesHtml\}\}/g,
    buildSeparatedHtml(languageItems, {
      itemClass: 'inline-item',
      separatorClass: 'inline-separator',
      separatorText: '\u2022'
    })
  );

  return html;
}

function getContactParts(data) {
  return [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.linkedin,
    data.personal.website
  ].filter(Boolean);
}

function injectFontPaths(html) {
  const fontDir = path.join(process.cwd(), 'fonts');

  try {
    // Inject fonts as Base64 data URIs to bypass Chromium file:// security blocks
    const regularBase64 = fs.readFileSync(path.join(fontDir, PDF_FONTS.regular)).toString('base64');
    const boldBase64 = fs.readFileSync(path.join(fontDir, PDF_FONTS.bold)).toString('base64');

    const fontRegularPath = `data:font/ttf;base64,${regularBase64}`;
    const fontBoldPath = `data:font/ttf;base64,${boldBase64}`;

    return html
      .replace(/\{\{fontRegularPath\}\}/g, fontRegularPath)
      .replace(/\{\{fontBoldPath\}\}/g, fontBoldPath);
  } catch (error) {
    console.error("Failed to inject fonts:", error);
    return html;
  }
}

function replaceConditionalBlock(template, blockName, isEnabled) {
  const pattern = new RegExp(`\\{\\{#${blockName}\\}\\}([\\s\\S]*?)\\{\\{\\/${blockName}\\}\\}`, 'g');
  return template.replace(pattern, (_, content) => (isEnabled ? content : ''));
}

function replaceLoopBlock(template, blockName, items, renderer) {
  const pattern = new RegExp(`\\{\\{#${blockName}\\}\\}([\\s\\S]*?)\\{\\{\\/${blockName}\\}\\}`, 'g');
  return template.replace(pattern, (_, content) => items.map(item => renderer(content, item)).join(''));
}

function buildSeparatedHtml(items, options) {
  const { itemClass, separatorClass, separatorText } = options;
  const values = items
    .map(item => String(item || '').trim())
    .filter(Boolean);

  return values.map((value, index) => {
    const dir = getTextDirection(value);
    const separator = index < values.length - 1
      ? `<span class="${separatorClass}" aria-hidden="true">${escapeHtml(separatorText)}</span>`
      : '';

    return `<span class="${itemClass} ${itemClass}--${dir}" dir="${dir}">${escapeHtml(value)}</span>${separator}`;
  }).join('');
}

function buildStackHtml(items) {
  return items
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .map(item => {
      const dir = getTextDirection(item);
      return `<span class="contact-stack-item contact-stack-item--${dir}" dir="${dir}">${escapeHtml(item)}</span>`;
    })
    .join('');
}

function escapeHtml(text) {
  if (!text) {
    return '';
  }

  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { generatePdf };
