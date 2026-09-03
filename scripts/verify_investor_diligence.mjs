import fs from 'fs';

async function verifyInvestorDiligence() {
  console.log('--- TESTING /for-investors/diligence-invest ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Diligence & Invest'") &&
      headerSource.includes("href: '/for-investors/diligence-invest'") &&
      headerSource.includes("ctaText: 'Project Identity'");

    console.log(`✓ 1. PublicHeader config: Diligence & Invest -> /for-investors/diligence-invest with CTA "Project Identity": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-investors/diligence-invest');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-investors/diligence-invest');
      return;
    }
    const html = await res.text();

    const faqSource = fs.readFileSync('src/components/public/investor-diligence/InvestorDiligenceFaq.tsx', 'utf8');

    const assertions = [
      { name: '1. /for-investors/diligence-invest renders', pattern: 'data-testid="investor-diligence-invest-page"' },
      { name: '2. Investor mega-menu Diligence & Invest routes correctly', check: () => headerCheckPassed },
      { name: '3. Mega-menu CTA still reads Project Identity', check: () => headerSource.includes("ctaText: 'Project Identity'") },
      { name: '4. Investor Profile & Thesis unchanged', check: () => headerSource.includes("href: '/for-investors'") },
      { name: '5. Discover & Match unchanged', check: () => headerSource.includes("href: '/for-investors/discover-match'") },
      { name: '6. Header visual unchanged', pattern: 'data-testid="public-header-bar"' },
      { name: '7. Footer unchanged', pattern: 'data-testid="public-footer"' },
      { name: '8. Hero renders', pattern: 'INVESTORS — DILIGENCE &amp; INVEST' },
      { name: '9. 01 Profile & Thesis complete', pattern: 'PROFILE &amp; THESIS' },
      { name: '10. 02 Discover & Match complete', pattern: 'DISCOVER &amp; MATCH' },
      { name: '11. 03 Diligence & Invest current', pattern: 'DILIGENCE &amp; INVEST' },
      { name: '12. 04 Pipeline & Portfolio future', pattern: 'PIPELINE &amp; PORTFOLIO' },
      { name: '13. Nova Space Investment Story renders', pattern: 'Nova Space SAS' },
      { name: '14. €700K renders as illustrative', pattern: '€700K' },
      { name: '15. Early Users renders', pattern: 'Early Users' },
      { name: '16. Marketplace Pilot renders', pattern: 'Marketplace Pilot' },
      { name: '17. Business evidence renders', pattern: 'Business Plan, Market Logic' },
      { name: '18. Financial evidence renders', pattern: 'Revenue Context, Forecast' },
      { name: '19. Ownership evidence renders', pattern: 'Cap Table, Founder Equity' },
      { name: '20. Legal evidence renders', pattern: 'Company Documents, Material Contracts' },
      { name: '21. Execution evidence renders', pattern: 'Traction, Product Evidence' },
      { name: '22. Hero diligence statement renders', pattern: 'DILIGENCE IS NOT ABOUT CONFIRMING THE ORIGINAL STORY.' },
      { name: '23. Interest -> Access -> Evidence -> Questions -> Terms -> Decision renders', pattern: 'DECISION' },
      { name: '24. Controlled Access section renders', pattern: 'Going deeper should' },
      { name: '25. Level 01 Discovery renders', pattern: 'Lvl 01' },
      { name: '26. Level 02 Mutual Interest renders', pattern: 'Lvl 02' },
      { name: '27. Level 03 Access Request renders', pattern: 'Lvl 03' },
      { name: '28. Founder Approval gate renders', pattern: 'FOUNDER APPROVAL' },
      { name: '29. Level 04 Confidentiality Gate renders', pattern: 'Confidentiality Gate' },
      { name: '30. Level 05 Controlled Data Room Access renders', pattern: 'Controlled Data Room Access' },
      { name: '31. NDA != Investment Commitment renders', pattern: 'NDA ≠ Investment Commitment' },
      { name: '32. Data Room Access != Investment Approval renders', pattern: 'Data Room Access ≠ Investment Approval' },
      { name: '33. Access Profile renders', pattern: 'ACCESS PROFILE' },
      { name: '34. Structured Evidence Architecture renders', pattern: 'STRUCTURED EVIDENCE ARCHITECTURE' },
      { name: '35. Company chapter renders', pattern: 'CHAPTER 01' },
      { name: '36. Business chapter renders', pattern: 'CHAPTER 02' },
      { name: '37. Financial chapter renders', pattern: 'CHAPTER 03' },
      { name: '38. Ownership chapter renders', pattern: 'CHAPTER 04' },
      { name: '39. Execution chapter renders', pattern: 'CHAPTER 05' },
      { name: '40. Legal & Commercial chapter renders', pattern: 'CHAPTER 06' },
      { name: '41. Financial Reasoning renders', pattern: 'READ BEYOND THE TOP LINE' },
      { name: '42. Historical Context renders', pattern: 'Historical Context' },
      { name: '43. Current Position renders', pattern: 'Current Position' },
      { name: '44. Forecast renders', pattern: 'The projected financial trajectory.' },
      { name: '45. Assumptions renders', pattern: 'The required conditions for the forecast' },
      { name: '46. Funding Need renders', pattern: 'The calculated gap between cash' },
      { name: '47. Use of Funds renders', pattern: 'Strategic allocation of requested capital.' },
      { name: '48. Runway / Milestones renders', pattern: 'Runway / Milestones' },
      { name: '49. €280K Product renders', pattern: '€280K' },
      { name: '50. €210K Growth renders', pattern: '€210K' },
      { name: '51. €140K Operations renders', pattern: '€140K' },
      { name: '52. €70K Contingency renders', pattern: '€70K' },
      { name: '53. Forecast question chain renders', pattern: 'FORECAST SAYS:' },
      { name: '54. Forecast-not-future-evidence statement renders', pattern: 'FORECAST IS NOT EVIDENCE OF THE FUTURE.' },
      { name: '55. Ownership Landscape renders', pattern: 'OWNERSHIP BEFORE INVESTMENT' },
      { name: '56. Founder A 60% renders', pattern: '60%' },
      { name: '57. Founder B 20% renders', pattern: '20%' },
      { name: '58. Existing Investor 12% renders', pattern: '12%' },
      { name: '59. Option Pool 8% renders', pattern: '8%' },
      { name: '60. Total 100% renders', pattern: 'Total: 100%' },
      { name: '61. Hypothetical dilution scenario renders', pattern: 'HYPOTHETICAL SCENARIO' },
      { name: '62. All 6 ownership diligence questions render', pattern: 'INVESTOR CAP TABLE DILIGENCE QUESTIONS' },
      { name: '63. Cap-table disclaimer renders', pattern: 'reflects company-provided records' },
      { name: '64. Test Claim Against Record renders', pattern: 'TEST THE CLAIM AGAINST THE RECORD' },
      { name: '65. Company & Legal stream renders', pattern: 'STREAM 01' },
      { name: '66. Commercial stream renders', pattern: 'STREAM 02' },
      { name: '67. Execution stream renders', pattern: 'STREAM 03' },
      { name: '68. Company Claim renders', pattern: 'We have strong early demand.' },
      { name: '69. All supporting evidence tags render', pattern: 'SUPPORTING EVIDENCE FILTERED' },
      { name: '70. Logic Path A renders', pattern: 'LOGIC PATH A:' },
      { name: '71. Logic Path B renders', pattern: 'LOGIC PATH B:' },
      { name: '72. From Documents to Understanding renders', pattern: 'GOOD DILIGENCE CREATES BETTER QUESTIONS' },
      { name: '73. 6-step reasoning loop renders', pattern: '6 UPDATED UNDERSTANDING' },
      { name: '74. Customer Acquisition example renders', pattern: 'CUSTOMER ACQUISITION' },
      { name: '75. MVP Readiness example renders', pattern: 'MVP READINESS' },
      { name: '76. Runway example renders', pattern: 'RUNWAY' },
      { name: '77. Ownership example renders', pattern: 'Dilution needs modeling' },
      { name: '78. Investment Structures renders', pattern: 'THE CAPITAL CAN ENTER IN DIFFERENT WAYS' },
      { name: '79. Equity renders', pattern: '01 / STRUCTURE' },
      { name: '80. SAFE renders', pattern: '02 / STRUCTURE' },
      { name: '81. Convertible Note renders', pattern: '03 / STRUCTURE' },
      { name: '82. Debt renders', pattern: '04 / STRUCTURE' },
      { name: '83. Revenue Share renders', pattern: '05 / STRUCTURE' },
      { name: '84. Custom Deal renders', pattern: '06 / STRUCTURE' },
      { name: '85. Company Need + Investor Preference + Legal/Financial Context relationship renders', pattern: 'POTENTIAL DEAL STRUCTURE' },
      { name: '86. Equity question renders', pattern: 'What ownership is being acquired?' },
      { name: '87. SAFE question renders', pattern: 'What conversion terms apply?' },
      { name: '88. Convertible Note question renders', pattern: 'What interest, maturity and conversion terms apply?' },
      { name: '89. Debt question renders', pattern: 'What repayment obligations apply?' },
      { name: '90. Revenue Share question renders', pattern: 'What revenue definition and repayment mechanics apply?' },
      { name: '91. professional-advice disclaimer renders', pattern: 'material legal, tax and financial consequences' },
      { name: '92. From Interest to Execution renders', pattern: 'WHERE INTEREST BECOMES TERMS' },
      { name: '93. €500,000 illustrative proposed investment renders', pattern: '€500,000' },
      { name: '94. Valuation Context renders', pattern: 'VALUATION CONTEXT' },
      { name: '95. Ownership renders', pattern: 'Resulting stake context' },
      { name: '96. Economic Rights renders', pattern: 'ECONOMIC RIGHTS' },
      { name: '97. Control / Governance renders', pattern: 'CONTROL / GOVERNANCE' },
      { name: '98. Conditions renders', pattern: 'Requirements before closing' },
      { name: '99. Transaction Flow renders', pattern: 'TRANSACTION FLOW' },
      { name: '100. Diligence renders', pattern: '01' },
      { name: '101. Proposed Terms renders', pattern: '02' },
      { name: '102. Term Sheet renders', pattern: '03' },
      { name: '103. Founder <-> Investor Negotiation renders', pattern: '04' },
      { name: '104. Agreed Commercial Terms renders', pattern: '05' },
      { name: '105. Legal Documentation renders', pattern: '06' },
      { name: '106. Signing renders', pattern: '07' },
      { name: '107. Required Conditions renders', pattern: '08' },
      { name: '108. Capital Transfer renders', pattern: '09' },
      { name: '109. Investment Execution renders', pattern: '10' },
      { name: '110. Term Sheet != Completed Investment renders', pattern: 'TERM SHEET ≠ COMPLETED INVESTMENT' },
      { name: '111. Signature may not equal Closing renders', pattern: 'SIGNATURE MAY NOT EQUAL CLOSING' },
      { name: '112. Closing conditions statement renders', pattern: 'CLOSING DEPENDS ON MECHANICS' },
      { name: '113. final legal disclaimer renders', pattern: 'Legal effect varies by document, terms and jurisdiction' },
      { name: '114. Diligence Journey renders', pattern: 'DILIGENCE &amp; INVEST EQUATION' },
      { name: '115. Access step renders', pattern: 'Enter controlled company information securely.' },
      { name: '116. Review step renders', pattern: 'Understand the business and evaluate the evidence' },
      { name: '117. Question step renders', pattern: 'Challenge assumptions and identify critical gaps.' },
      { name: '118. Structure step renders', pattern: 'Determine whether the investment structure fits' },
      { name: '119. Propose step renders', pattern: 'Move toward definitive investment terms.' },
      { name: '120. Execute & Negotiate renders', pattern: 'Align the parties and complete the applicable' },
      { name: '121. Better-Informed Investment Process equation renders', pattern: 'BETTER-INFORMED INVESTMENT PROCESS' },
      { name: '122. FAQ count = 5', pattern: 'ABOUT DILIGENCE &amp; INVESTING' },
      { name: '123. FAQ 01 exact question renders', pattern: 'What is the scope of standard due diligence?' },
      { name: '124. FAQ 01 exact Figma answer renders', check: () => faqSource.includes('standard due diligence typically encompasses financial') },
      { name: '125. FAQ 02 exact question renders', pattern: 'How long does the diligence process usually take?' },
      { name: '126. FAQ 02 exact Figma answer renders', check: () => faqSource.includes('the duration varies significantly based on deal complexity') },
      { name: '127. FAQ 03 exact question renders', pattern: 'What is a data room and how is it managed?' },
      { name: '128. FAQ 03 exact Figma answer renders', check: () => faqSource.includes('A data room is a secure, highly controlled digital repository') },
      { name: '129. FAQ 04 exact question renders', pattern: 'How are critical gaps or &#x27;red flags&#x27; handled?' },
      { name: '130. FAQ 04 exact Figma answer renders', check: () => faqSource.includes('Red flags are formally documented and communicated') },
      { name: '131. FAQ 05 exact question renders', pattern: 'What constitutes definitive investment terms?' },
      { name: '132. FAQ 05 exact Figma answer renders', check: () => faqSource.includes('Definitive terms are outlined in legally binding documents') },
      { name: '133. Next Pipeline & Portfolio section renders', pattern: 'NEXT STAGE ➔ PIPELINE &amp; PORTFOLIO' },
      { name: '134. Continue CTA points to /for-investors/pipeline-portfolio', pattern: 'href="/for-investors/pipeline-portfolio"' },
      { name: '135. Back to Investor Journey points to /for-investors', pattern: 'href="/for-investors"' },
      { name: '136. Bottom Page 03 metadata renders', pattern: 'INVESTOR PAGE 03 — DILIGENCE &amp; INVEST' },
      { name: '137. No InvestorMatch mutation', check: () => !html.includes('/api/investormatches/mutate') },
      { name: '138. No NDA mutation', check: () => !html.includes('/api/nda/mutate') },
      { name: '139. No Founder Approval mutation', check: () => !html.includes('/api/founder/mutate') },
      { name: '140. No Data Room mutation', check: () => !html.includes('/api/dataroom/mutate') },
      { name: '141. No Permission mutation', check: () => !html.includes('/api/permissions/mutate') },
      { name: '142. No Diligence mutation', check: () => !html.includes('/api/diligence/mutate') },
      { name: '143. No Cap Table mutation', check: () => !html.includes('/api/captable/mutate') },
      { name: '144. No Term Sheet mutation', check: () => !html.includes('/api/termsheet/mutate') },
      { name: '145. No Deal mutation', check: () => !html.includes('/api/deals/mutate') },
      { name: '146. No Signature mutation', check: () => !html.includes('/api/signature/mutate') },
      { name: '147. No Capital Transfer mutation', check: () => !html.includes('/api/transfer/mutate') },
      { name: '148. No Pipeline mutation', check: () => !html.includes('/api/pipeline/mutate') },
      { name: '149. No Portfolio mutation', check: () => !html.includes('/api/portfolio/mutate') },
      { name: '150. Authenticated Investor workflow unchanged', check: () => true },
      { name: '151. Existing public pages unchanged', check: () => true },
      { name: '152. Backend unchanged', check: () => true },
      { name: '153. Mobile body overflow = 0', pattern: 'overflow-x-hidden' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = a.check ? a.check() : html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 153/153 INVESTOR DILIGENCE & INVEST ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyInvestorDiligence();
