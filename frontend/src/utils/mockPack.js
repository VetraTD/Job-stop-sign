/**
 * Credible mock copy for an application pack.
 * Uses company, job title, and tone only where a real writer would—never pastes CV or JD text.
 */
export function generateMockPack({ company, jobTitle, tone }) {
  const org = (company || 'the organisation').trim()
  const role = (jobTitle || 'this role').trim()

  const t =
    tone === 'formal'
      ? 'formal'
      : tone === 'warm'
        ? 'warm'
        : tone === 'bold'
          ? 'bold'
          : 'professional'

  const byTone = {
    formal: {
      cvNotes: [
        'Open with a headline and one line that state your level and the outcomes you own, so the first screen answers “why you” before the reader scrolls.',
        'Under each recent role, lead with a measurable result, then how you achieved it. Avoid long duty lists that could apply to anyone with the same title.',
        'Keep earlier roles to one line unless they directly support this move; education and certifications should support, not compete with, your experience.',
      ],
      summary: `Professional with a steady record of owning complex work end to end: clarifying requirements, coordinating across teams, and delivering work that stands up to review. Values precision in communication and sound judgement when trade-offs appear. Interested in contributing as ${role} at ${org}, where rigour and stakeholder trust matter.`,
      letterOpen: `Dear Hiring Manager,\n\nI wish to apply for the position of ${role} at ${org}.`,
      letterMid1:
        'In my recent roles I have been responsible for translating objectives into clear plans, managing dependencies, and ensuring deliverables meet a high standard before handoff. I work comfortably with colleagues whose priorities differ, and I take care to make technical or specialised topics accessible to decision-makers.',
      letterMid2:
        'I would welcome the opportunity to discuss how my experience aligns with your needs and to learn more about how the team operates.',
      letterClose: 'Yours faithfully',
      strengths: [
        'Sets clear scope and success measures at the outset, and revisits them when context shifts.',
        'Provides concise written and verbal updates so sponsors stay informed without excess detail.',
        'Knows when to insist on quality, when to ship, and when to escalate for a decision.',
        'Documents handoffs so the next person can continue the work without rework.',
      ],
      questions: [
        'How would you define success for this hire in the first ninety days?',
        'How does the team set goals and report progress to leadership?',
        'What qualities have distinguished people who have thrived in comparable roles?',
        'Where do cross-team dependencies create the most friction today?',
        'What would a constructive first month look like from your perspective?',
      ],
      followSubject: 'Thank you for your time',
      followBody: `Dear [Name],\n\nThank you for the opportunity to discuss the ${role} position and for the additional context you provided about ${org}.\n\nI remain very interested in the role. If further materials would be helpful, I would be pleased to supply them at short notice.\n\nI look forward to hearing from you when convenient.`,
    },
    warm: {
      cvNotes: [
        'Start with a short, human snapshot: who you are professionally, what you enjoy doing, and the kind of impact people would say you leave behind.',
        'Tell each role as a compact story: what you owned, what changed, and who benefited. Numbers help, but plain language matters too.',
        'Give the layout room to breathe—clear headings and spacing make a CV much easier to skim under time pressure.',
      ],
      summary: `People-centred professional who likes turning messy problems into a plan everyone can follow. Brings patience for listening, a habit of writing things down, and follow-through colleagues can rely on. Looking for a ${role} where that style is a fit; ${org} appealed because the remit sounds collaborative and outcome-focused.`,
      letterOpen: `Dear Hiring Manager,\n\nI was pleased to find the opening for ${role} at ${org} and would be grateful if you would consider my application.`,
      letterMid1:
        'The part of my work I find most rewarding is the stretch between a vague need and something shipped: getting people aligned, making trade-offs visible, and keeping momentum without cutting corners. I care about how teammates and stakeholders experience working with me, not only what lands on the page.',
      letterMid2:
        'I would enjoy learning more about how your team works day to day and where you feel this hire would add the most value.',
      letterClose: 'Warm regards',
      strengths: [
        'Builds trust quickly by doing what I say I will do, including the small commitments.',
        'Makes complex work legible so everyone shares the same picture of “done”.',
        'Stays steady when dates move: reprioritises openly and brings others along.',
        'Captures lessons after major work so the next cycle goes a little smoother.',
      ],
      questions: [
        'What does a great week look like for this team?',
        'How does feedback tend to flow here, formally and informally?',
        'What would you hope I ask about in a first conversation?',
        'Where could an extra pair of hands help most over the next quarter?',
        'What does onboarding and early support look like for new hires?',
      ],
      followSubject: 'Thank you — enjoyed our conversation',
      followBody: `Hi [Name],\n\nThank you again for taking the time to speak with me about the ${role} opportunity and for sharing more about life at ${org}.\n\nI left even more interested in the role. If a short writing sample, references, or anything else would help on your side, I am glad to send them along.\n\nHope to stay in touch.`,
    },
    bold: {
      cvNotes: [
        'Open with proof, not adjectives: the first screen should answer why you are worth a conversation, using outcomes rather than generic claims.',
        'Prefer one strong metric or scope statement per bullet over three vague lines. If you cannot quantify yet, use clear scope until you can.',
        'Align your headline with the level you are targeting so reviewers do not have to infer seniority from buried details.',
      ],
      summary: `Hands-on professional with a bias for shipping. Comfortable owning a lane from scoping through delivery, cutting through noise, and driving to a decision. Works best with clear goals and managers who care about outcomes. Interested in ${role} at ${org} because the remit reads like a place where ownership is real.`,
      letterOpen: `Dear Hiring Manager,\n\nI am applying for the ${role} role at ${org}.`,
      letterMid1:
        'What you can expect from me: I take ownership, I flag risk early, and I finish what I start. I have repeatedly turned unclear mandates into shipped work by narrowing scope, aligning stakeholders, and executing with discipline.',
      letterMid2:
        'I am deliberate about where I invest my next chapter. If you want someone who will lean in from week one, I would welcome a direct conversation.',
      letterClose: 'Best regards',
      strengths: [
        'Names the problem, proposes options, and drives to a decision when the team stalls.',
        'Ships incremental value while keeping the larger objective in view.',
        'Holds a high bar on review and handoff quality so rework stays rare.',
        'Shows up prepared and evidence-led with senior stakeholders.',
      ],
      questions: [
        'What single outcome would make this hire an obvious success?',
        'Where is the team under-investing relative to the risk or opportunity?',
        'What would you need to see in the first sixty days to feel confident?',
        'Which stakeholders are the hardest for this role to satisfy—and why?',
        'What has caused similar hires to struggle here before?',
      ],
      followSubject: 'Following up — next steps',
      followBody: `Hi [Name],\n\nThanks for the straight conversation about the ${role} opportunity and priorities at ${org}.\n\nI am ready to move at whatever pace works for you—another conversation, a short exercise, or introductions on your side. Tell me what helps you decide.\n\nAppreciate your time.`,
    },
    professional: {
      cvNotes: [
        'Put your strongest proof above the fold: headline, three bullets of outcomes, and a one-line summary of level and domain before the reader scrolls.',
        'For each recent role, lead with results, then responsibilities. Recruiters skim; the first line of each block carries most of the signal.',
        'Tailor thoughtfully: echo important terms once per section with a proof point behind each—avoid long pasted phrases from postings.',
      ],
      summary: `Reliable professional with experience delivering in fast-moving environments. Combines structured thinking with practical execution: clarifying goals, coordinating across teams, and following through on commitments. Values clear communication and documentation that helps the organisation learn. Seeking a ${role} where those strengths add value; ${org} is a company I would be glad to support.`,
      letterOpen: `Dear Hiring Manager,\n\nI am writing to apply for the ${role} position at ${org}.`,
      letterMid1:
        'Throughout my career I have focused on turning priorities into delivered work: aligning stakeholders, making trade-offs explicit, and maintaining quality as pace increases. I am comfortable operating with incomplete information while keeping risk visible and decisions traceable.',
      letterMid2:
        'I would welcome the opportunity to discuss how my background could meet your needs and to learn more about how the team works together.',
      letterClose: 'Kind regards',
      strengths: [
        'Breaks work into milestones with clear owners and dates.',
        'Builds trust through consistent, predictable communication with stakeholders.',
        'Balances speed with sensible review, testing, and documentation.',
        'Ramps quickly on new subject matter without losing sight of business priorities.',
      ],
      questions: [
        'How would you define success for this role in the first three to six months?',
        'What are the team’s top priorities this quarter, and how does this position support them?',
        'How is performance typically measured and discussed?',
        'Which collaboration patterns work best with adjacent teams?',
        'What should a new hire focus on learning in the first few weeks?',
      ],
      followSubject: 'Thank you — next steps',
      followBody: `Hi [Name],\n\nThank you for making time to discuss the ${role} opportunity and for the context you shared about ${org}.\n\nI remain very interested. If references or a short work sample would help, I can provide them on request. Please let me know how you would like to proceed whenever it suits your schedule.\n\nThank you again for your consideration.`,
    },
  }

  const c = byTone[t]

  const coverLetter = `${c.letterOpen}

${c.letterMid1}

${c.letterMid2}

Thank you for considering my application.

${c.letterClose},
[Your name]`

  const followUpEmail = `Subject: ${c.followSubject}

${c.followBody}

${c.letterClose},
[Your name]`

  return {
    cvImprovementNotes: c.cvNotes,
    tailoredSummary: c.summary,
    coverLetter,
    strengthsToMention: c.strengths,
    interviewQuestions: c.questions,
    followUpEmail,
  }
}

export function createId() {
  return `app_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
