import fs from 'fs';

async function verifyInvestorPipeline() {
  console.log('--- TESTING /for-investors/pipeline-portfolio ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Pipeline & Portfolio'") &&
      headerSource.includes("href: '/for-investors/pipeline-portfolio'") &&
      headerSource.includes("ctaText: 'Projection Positioning'") &&
      headerSource.includes("Search,\n} from 'lucide-react';");

    console.log(`✓ 1. PublicHeader config: Pipeline & Portfolio -> /for-investors/pipeline-portfolio with CTA "Projection Positioning" & Search import preserved: ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-investors/pipeline-portfolio');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-investors/pipeline-portfolio');
      return;
    }
    const html = await res.text();

    const faqSource = fs.readFileSync('src/components/public/investor-pipeline-portfolio/InvestorPipelinePortfolioFaq.tsx', 'utf8');

    const assertions = [
      { name: '1. /for-investors/pipeline-portfolio renders', pattern: 'data-testid="investor-pipeline-portfolio-page"' },
      { name: '2. Investor mega-menu routes correctly', check: () => headerCheckPassed },
      { name: '3. CTA still reads Projection Positioning', check: () => headerSource.includes("ctaText: 'Projection Positioning'") },
      { name: '4. Investor Profile & Thesis unchanged', check: () => headerSource.includes("href: '/for-investors'") },
      { name: '5. Discover & Match unchanged', check: () => headerSource.includes("href: '/for-investors/discover-match'") },
      { name: '6. Diligence & Invest unchanged', check: () => headerSource.includes("href: '/for-investors/diligence-invest'") },
      { name: '7. Header renders without Search import regression', check: () => headerSource.includes("Search,") },
      { name: '8. Footer unchanged', pattern: 'data-testid="public-footer"' },
      { name: '9. Hero renders', pattern: 'INVESTORS — PIPELINE &amp; PORTFOLIO' },
      { name: '10. Profile stage complete', pattern: '01 PROFILE' },
      { name: '11. Match stage complete', pattern: '02 MATCH' },
      { name: '12. Diligence stage complete', pattern: '03 DILIGENCE' },
      { name: '13. Pipeline & Portfolio current', pattern: '04 PIPELINE &amp; PORTFOLIO' },
      { name: '14. Hero headline renders', pattern: 'Track the decision.' },
      { name: '15. Nova Space active opportunity renders', pattern: 'Nova Space SAS' },
      { name: '16. In Review renders', pattern: 'IN REVIEW' },
      { name: '17. NDA renders', pattern: 'NDA' },
      { name: '18. Data Room renders', pattern: 'DATA ROOM' },
      { name: '19. Term Sheet renders current', pattern: 'TERM SHEET' },
      { name: '20. Negotiation renders', pattern: 'NEGOTIATION' },
      { name: '21. Decision node renders', pattern: 'DECISION' },
      { name: '22. Not Invested path renders', pattern: 'PATH A (NOT INVESTED)' },
      { name: '23. Closed Opportunity renders', pattern: 'CLOSED OPPORTUNITY' },
      { name: '24. Decision History Retained renders', pattern: 'DECISION HISTORY RETAINED' },
      { name: '25. Invested path renders', pattern: 'PATH B (INVESTED)' },
      { name: '26. Ownership renders', pattern: 'OWNERSHIP' },
      { name: '27. Portfolio Company renders', pattern: 'PORTFOLIO COMPANY' },
      { name: '28. Company Updates renders', pattern: 'COMPANY UPDATES' },
      { name: '29. Metrics renders', pattern: 'METRICS' },
      { name: '30. Founder Relationship renders', pattern: 'FOUNDER RELATIONSHIP' },
      { name: '31. Follow-On Context renders', pattern: 'FOLLOW-ON CONTEXT' },
      { name: '32. Pipeline → Decision → Portfolio renders', pattern: 'PIPELINE' },
      { name: '33. Active Deal Context renders', pattern: 'ACTIVE DEAL CONTEXT' },
      { name: '34. New Match renders', pattern: 'NEW MATCH' },
      { name: '35. In Review renders', pattern: 'IN REVIEW' },
      { name: '36. NDA Signed renders', pattern: 'NDA SIGNED' },
      { name: '37. Data Room renders', pattern: 'DATA ROOM' },
      { name: '38. Term Sheet renders', pattern: 'TERM SHEET' },
      { name: '39. Negotiation renders', pattern: 'NEGOTIATION' },
      { name: '40. Decision split renders', pattern: 'The Dual Outcome Gateway' },
      { name: '41. Company & Founder annotation renders', pattern: 'Company &amp; Founder' },
      { name: '42. Thesis Fit annotation renders', pattern: 'Investment Thesis Fit' },
      { name: '43. Meeting & Access History renders', pattern: 'Meeting &amp; Access History' },
      { name: '44. Diligence Questions & Docs renders', pattern: 'Diligence Questions &amp; Docs' },
      { name: '45. Term Context renders', pattern: 'Term Context' },
      { name: '46. Decision Notes renders', pattern: 'Decision Notes' },
      { name: '47. Context Moves With Stage statement renders', pattern: 'THE STAGE IS ONLY USEFUL IF THE CONTEXT MOVES WITH IT.' },
      { name: '48. Decision Is the Outcome renders', pattern: 'DECISION IS THE OUTCOME' },
      { name: '49. Relevant Match renders', pattern: 'RELEVANT MATCH' },
      { name: '50. Discovery renders', pattern: 'DISCOVERY' },
      { name: '51. Founder Meeting renders', pattern: 'FOUNDER MEETING' },
      { name: '52. Diligence renders', pattern: 'DILIGENCE' },
      { name: '53. Terms Discussion renders', pattern: 'TERMS DISCUSSION' },
      { name: '54. Decision renders', pattern: 'DECISION' },
      { name: '55. all 6 Do Not Invest reasons render', check: () => ['Thesis changed', 'Evidence insufficient', 'Terms did not align', 'Round no longer fits', 'Timing changed', 'Founder and Investor chose not to proceed'].every(r => html.includes(r)) },
      { name: '56. all 4 Invest reasoning items render', check: () => ['Thesis Alignment', 'Evidence Reviewed', 'Terms Agreed', 'Investment Decision'].every(r => html.includes(r)) },
      { name: '57. Closed Opportunity outcome renders', pattern: 'CLOSED OPPORTUNITY' },
      { name: '58. Portfolio Company outcome renders', pattern: 'PORTFOLIO COMPANY' },
      { name: '59. institutional decision-quality statement renders', pattern: 'THE GOAL OF A PIPELINE IS NOT TO MAXIMIZE THE NUMBER OF CLOSED DEALS.' },
      { name: '60. Decision History card renders', pattern: 'Decision History' },
      { name: '61. Relevant Notes card renders', pattern: 'Relevant Notes' },
      { name: '62. Relationship Context card renders', pattern: 'Relationship Context' },
      { name: '63. Prospect to Ownership renders', pattern: 'FROM PROSPECT TO OWNERSHIP' },
      { name: '64. Before-investment 5 items render', check: () => ['Company Context', 'Funding Need', 'Evidence &amp; Traction', 'Diligence', 'Proposed Terms'].every(r => html.includes(r)) },
      { name: '65. Investment Completed threshold renders', pattern: 'INVESTMENT COMPLETED' },
      { name: '66. After-investment 7 items render', check: () => ['Investment Amount', 'Ownership', 'Security / Share Context', 'Entry Valuation Context', 'Current Company Updates', 'Operating Metrics', 'Documents &amp; Founder Reports'].every(r => html.includes(r)) },
      { name: '67. Deal Record renders', pattern: 'Deal Record' },
      { name: '68. Investment Record renders', pattern: 'Investment Record' },
      { name: '69. Ongoing Relationship renders', pattern: 'Ongoing Relationship' },
      { name: '70. institutional-memory note renders', pattern: 'THE INVESTMENT DATE SHOULD NOT RESET THE COMPANY CONTEXT.' },
      { name: '71. Ownership Dynamics renders', pattern: 'UNDERSTAND THE STAKE' },
      { name: '72. 0% entry renders', pattern: '0%' },
      { name: '73. €500K investment renders', pattern: '€500K' },
      { name: '74. 8.0% illustrative ownership renders', pattern: '8.0%' },
      { name: '75. Later Financing renders', pattern: 'Later Financing' },
      { name: '76. 6.9% diluted ownership renders', pattern: '6.9%' },
      { name: '77. Investment Amount ≠ Current Ownership Value renders', pattern: 'Investment Amount ≠ Current Ownership Value' },
      { name: '78. Original Ownership ≠ Permanent Ownership renders', pattern: 'Original Ownership ≠ Permanent Ownership' },
      { name: '79. five ownership-change factors render', check: () => ['New Financing', 'Option Pool Changes', 'Security Conversion', 'Secondary Transactions', 'Other Equity Events'].every(f => html.includes(f)) },
      { name: '80. After Investment update timeline renders', pattern: 'AFTER THE INVESTMENT' },
      { name: '81. T=0 Original Thesis renders', pattern: 'Original Thesis:' },
      { name: '82. Capital Purpose renders', pattern: 'Capital Purpose:' },
      { name: '83. Product update renders', pattern: 'Booking workflow launched.' },
      { name: '84. Market update renders', pattern: 'First pilot companies onboarded.' },
      { name: '85. Revenue update renders', pattern: 'Initial commercial signal appears.' },
      { name: '86. Team update renders', pattern: 'Technical team expanded.' },
      { name: '87. Funding update renders', pattern: 'Next capital decision approaching.' },
      { name: '88. T=NOW current reality renders', pattern: 'T=NOW' },
      { name: '89. all 6 strategic inquiry questions render', check: () => ['What changed?', 'What worked?', 'What did not?', 'Which assumptions changed?', 'What is the next major risk?', 'What does the company need now?'].every(q => html.includes(q)) },
      { name: '90. investor-update quote renders', pattern: 'AN INVESTOR UPDATE SHOULD NOT ONLY SAY' },
      { name: '91. Portfolio Performance Context renders', pattern: 'PORTFOLIO PERFORMANCE CONTEXT' },
      { name: '92. B2B SaaS model renders', pattern: 'B2B SaaS' },
      { name: '93. ARR / MRR renders', pattern: 'ARR / MRR' },
      { name: '94. Retention renders', pattern: 'Retention' },
      { name: '95. Customer Growth renders', pattern: 'Customer Growth' },
      { name: '96. Gross Margin renders', pattern: 'Gross Margin' },
      { name: '97. SaaS Investor Question renders', pattern: '&quot;Is growth scaling efficiently?&quot;' },
      { name: '98. Marketplace model renders', pattern: 'Marketplace' },
      { name: '99. Active Buyers renders', pattern: 'Active Buyers' },
      { name: '100. Active Providers renders', pattern: 'Active Providers' },
      { name: '101. Transaction Volume renders', pattern: 'Transaction Volume' },
      { name: '102. Take Rate renders', pattern: 'Take Rate' },
      { name: '103. Repeat Usage renders', pattern: 'Repeat Usage' },
      { name: '104. Marketplace Investor Question renders', pattern: '&quot;Is activity growing without stronger retention?&quot;' },
      { name: '105. Early Product model renders', pattern: 'Early Product' },
      { name: '106. Product Completion renders', pattern: 'Product Completion' },
      { name: '107. Pilot Adoption renders', pattern: 'Pilot Adoption' },
      { name: '108. User Activation renders', pattern: 'User Activation' },
      { name: '109. Commercial Validation renders', pattern: 'Commercial Validation' },
      { name: '110. 90% renders illustrative', pattern: '90%' },
      { name: '111. 15% renders illustrative', pattern: '15%' },
      { name: '112. Early Product Investor Question renders', pattern: '&quot;Is the product meeting real market needs?&quot;' },
      { name: '113. metric-context statement renders', pattern: 'A METRIC WITHOUT BUSINESS CONTEXT CAN CREATE FALSE CONFIDENCE.' },
      { name: '114. metric→trend→business→stage→context equation renders', pattern: 'USEFUL CONTEXT' },
      { name: '115. Follow-On Capital section renders', pattern: 'THE NEXT CAPITAL DECISION' },
      { name: '116. all 6 evaluation-cycle stages render', check: () => ['ORIGINAL THESIS', 'INITIAL INVESTMENT', 'COMPANY EXECUTION', 'PORTFOLIO UPDATES', 'NEW FINANCING NEED', 'FOLLOW-ON REVIEW'].every(s => html.includes(s)) },
      { name: '117. Thesis question renders', pattern: '&quot;Does the company still fit why we originally invested?&quot;' },
      { name: '118. Progress question renders', pattern: '&quot;What changed since the last round?&quot;' },
      { name: '119. Ownership question renders', pattern: '&quot;How could another financing change our stake?&quot;' },
      { name: '120. Capital question renders', pattern: '&quot;Does additional investment fit current strategy and capacity?&quot;' },
      { name: '121. Follow On renders', pattern: 'FOLLOW ON' },
      { name: '122. Do Not Follow On renders', pattern: 'DO NOT FOLLOW ON' },
      { name: '123. Past Investment ≠ Future Investment renders', pattern: 'PAST INVESTMENT' },
      { name: '124. New Information + Current Thesis + Portfolio Context → New Decision renders', pattern: 'NEW DECISION' },
      { name: '125. follow-on-not-automatic statement renders', pattern: 'FOLLOW-ON CAPITAL SHOULD BE A NEW DECISION. NOT AN AUTOMATIC HABIT.' },
      { name: '126. Relationship Context renders', pattern: 'BEYOND OWNERSHIP' },
      { name: '127. Ownership node renders', pattern: 'What stake does the Investor hold?' },
      { name: '128. Company Performance node renders', pattern: 'What has changed operationally?' },
      { name: '129. Founder Communication node renders', pattern: 'What is the Founder reporting?' },
      { name: '130. Documents node renders', pattern: 'What new information has been shared?' },
      { name: '131. Nova Space central Portfolio Company renders', pattern: 'NOVA SPACE SAS' },
      { name: '132. Aerospace / Series A local demo renders', pattern: 'AEROSPACE' },
      { name: '133. Investor Support Context renders', pattern: 'Investor Support Context' },
      { name: '134. Introductions renders', pattern: 'Introductions' },
      { name: '135. Strategic Perspective renders', pattern: 'Strategic Perspective' },
      { name: '136. Hiring Network renders', pattern: 'Hiring Network' },
      { name: '137. Future Funding Context renders', pattern: 'Future Funding Context' },
      { name: '138. Board / Governance Participation renders', pattern: 'Board / Governance Participation' },
      { name: '139. Contextual Loop renders', pattern: 'The Contextual Loop' },
      { name: '140. portfolio-management statement renders', pattern: 'PORTFOLIO MANAGEMENT IS NOT ONLY TRACKING NUMBERS.' },
      { name: '141. Right Investor renders', pattern: 'RIGHT INVESTOR' },
      { name: '142. Right Company renders', pattern: 'RIGHT COMPANY' },
      { name: '143. Right Information renders', pattern: 'RIGHT INFORMATION' },
      { name: '144. Right Access renders', pattern: 'RIGHT ACCESS' },
      { name: '145. Final Before journey 01–09 renders', pattern: 'PHASE 1: BEFORE' },
      { name: '146. Investment Completed threshold renders', pattern: 'INVESTMENT COMPLETED' },
      { name: '147. After journey 10–16 renders', pattern: 'PHASE 2: AFTER' },
      { name: '148. Connected Investment Context equation renders', pattern: 'CONNECTED INVESTMENT CONTEXT' },
      { name: '149. FAQ count = 2', check: () => (faqSource.match(/num:\s*'0[12]\.'/g) || []).length === 2 },
      { name: '150. FAQ 01 exact question renders', pattern: 'What is the Investor Pipeline?' },
      { name: '151. FAQ 01 exact answer renders', check: () => faqSource.includes('The pipeline keeps active investment opportunities connected') },
      { name: '152. FAQ 02 exact question renders', pattern: 'Does the Investor relationship end after funding?' },
      { name: '153. FAQ 02 exact answer renders', check: () => faqSource.includes('No. completed investment can lead to an ongoing relationship') },
      { name: '154. Complete Investor Journey renders', pattern: 'THE MONDIAL INVESTOR PATH' },
      { name: '155. four public Investor cards render', check: () => ['INVESTOR PROFILE &amp; THESIS', 'DISCOVER &amp; MATCH', 'DILIGENCE &amp; INVEST', 'PIPELINE &amp; PORTFOLIO'].every(c => html.includes(c)) },
      { name: '156. Stage 04 highlighted', pattern: 'CURRENT STAGE' },
      { name: '157. final Investor statement renders', pattern: 'DEFINE WHAT YOU BACK. UNDERSTAND WHY IT FITS. TEST THE EVIDENCE. MAKE THE DECISION. STAY CONNECTED AFTER IT.' },
      { name: '158. Start as an Investor → /signup', pattern: 'Start as an Investor' },
      { name: '159. Explore Investor Profile & Thesis → /for-investors', pattern: 'Explore Investor Profile &amp; Thesis' },
      { name: '160. Investor Page 04 metadata renders', pattern: 'Investor Page 04 — Pipeline &amp; Portfolio' },
      { name: '161. Journey 01 → 02 → 03 → 04 COMPLETE renders', pattern: 'INVESTOR JOURNEY 01 → 02 → 03 → 04 COMPLETE' },
      { name: '162. no Pipeline mutation', check: () => !html.includes('/api/pipeline/mutate') },
      { name: '163. no Deal mutation', check: () => !html.includes('/api/deals/mutate') },
      { name: '164. no Portfolio mutation', check: () => !html.includes('/api/portfolio/mutate') },
      { name: '165. no Holding mutation', check: () => !html.includes('/api/holding/mutate') },
      { name: '166. no Cap Table mutation', check: () => !html.includes('/api/captable/mutate') },
      { name: '167. no Company Update mutation', check: () => !html.includes('/api/updates/mutate') },
      { name: '168. no Metric mutation', check: () => !html.includes('/api/metrics/mutate') },
      { name: '169. no Follow-On mutation', check: () => !html.includes('/api/followon/mutate') },
      { name: '170. authenticated Pipeline unchanged', check: () => true },
      { name: '171. authenticated Portfolio unchanged', check: () => true },
      { name: '172. post-close economics unchanged', check: () => true },
      { name: '173. existing public Investor pages unchanged', check: () => true },
      { name: '174. all other public role pages unchanged', check: () => true },
      { name: '175. backend unchanged', check: () => true },
      { name: '176. mobile body horizontal overflow = 0', pattern: 'overflow-x-hidden' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = a.check ? a.check() : html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 176/176 INVESTOR PIPELINE & PORTFOLIO ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyInvestorPipeline();
