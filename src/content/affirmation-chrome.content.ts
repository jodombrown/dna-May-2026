/**
 * affirmation-chrome.content
 * register: MARKETING VOICE
 *
 * Every string of UI chrome for the Affirmation flow — headings, labels,
 * buttons, helper text, empty states, confirmations, errors and toasts.
 * Clear, concrete Marketing Voice. No mythic register lives here; the
 * ceremony's internal-voice substance is in affirmation-ceremony.content
 * (BD062 / BD021).
 */

export const affirmationChromeContent = {
  register: 'MARKETING VOICE' as const,

  common: {
    loading: 'Loading…',
    genericError: 'Something went wrong. Please try again.',
    back: 'Back',
  },

  // Step a — role gate shown before the ceremony when no affirming role is set.
  gate: {
    title: 'Before you affirm',
    body: 'Affirmation is a commitment you make in a named role. Choose the role that fits where you stand, then continue to the ceremony.',
    continueCta: 'Continue to the ceremony',
    savingCta: 'Saving…',
    exploringNote:
      'You can affirm once you’ve claimed a role beyond exploring. Take the time you need — this will be here when you’re ready.',
    saveError: 'We couldn’t save your role. Please try again.',
  },

  // Step b — the ceremony screen.
  ceremony: {
    eyebrow: 'Your Affirmation',
    intro: 'Read the declaration for your role. When you’re ready, add anything you want to say, then continue to choose your witness.',
    statementLabel: 'Add a personal statement',
    statementOptional: 'Optional',
    statementPlaceholder: 'In your own words, why you’re affirming…',
    charCounterSuffix: 'characters left',
    commitCta: 'Continue to choose a witness',
  },

  // Step c — witness selection.
  witness: {
    title: 'Choose your witness',
    body: 'Your Affirmation is witnessed by an Affirmed Member who attests to it. Choose who will witness yours.',
    selectAria: 'Select a witness',
    submitCta: 'Send for attestation',
    submittingCta: 'Sending…',
    changeStatementCta: 'Back to your statement',
    unnamedMember: 'An Affirmed Member',
    emptyTitle: 'No witness is available yet',
    emptyBody:
      'Affirmations are witnessed by Affirmed Members. As the first members affirm, a witness will become available to you — this isn’t a dead end, just an early one. Check back soon; nothing you’ve written is lost.',
    emptyCta: 'Back to your feed',
    submitError: 'We couldn’t send your affirmation. Please try again.',
  },

  // Step d / state 2 — pending affirmation (also what /dna/affirm shows when a
  // pending row exists).
  pending: {
    eyebrow: 'Your Affirmation',
    title: 'Your affirmation is pending',
    statusNote: 'Your witness has been notified. Once they attest, your Affirmation is complete.',
    witnessLabel: 'Your witness',
    unnamedWitness: 'An Affirmed Member',
    editStatementCta: 'Edit statement',
    changeWitnessCta: 'Change witness',
    saveCta: 'Save changes',
    savingCta: 'Saving…',
    cancelCta: 'Cancel',
    savedToast: 'Your affirmation was updated.',
    saveError: 'We couldn’t save your changes. Please try again.',
    submittedToast: 'Your affirmation was sent for attestation.',
  },

  // State 4 — the completed, immutable Affirmation record.
  affirmed: {
    eyebrow: 'Affirmed Member',
    title: 'You are an Affirmed Member',
    witnessLabel: 'Witnessed by',
    unnamedWitness: 'An Affirmed Member',
    affirmedOnLabel: 'Affirmed',
    attestedOnLabel: 'Attested',
    statementLabel: 'Your statement',
    noStatement: 'No personal statement was added.',
    immutableNote: 'This record is complete and can’t be changed.',
  },

  // Screen 3 — the witness's attestation surface at /dna/affirm/attest/:id.
  attest: {
    eyebrow: 'Attestation',
    title: 'Attest an affirmation',
    introNamed: '{name} has named you as their witness.',
    introUnnamed: 'You’ve been named as a witness.',
    instruction: 'Read their declaration below. If you stand with it, attest.',
    roleLabel: 'Their role',
    statementLabel: 'Their statement',
    noStatement: 'No personal statement was added.',
    attestCta: 'Attest this affirmation',
    attestingCta: 'Attesting…',
    attestError: 'We couldn’t record your attestation. Please try again.',
    confirmTitle: 'You’ve attested',
    confirmBodyNamed: 'Thank you for witnessing. {name} is now an Affirmed Member.',
    confirmBodyUnnamed: 'Thank you for witnessing. This member is now Affirmed.',
    alreadyTitle: 'Already attested',
    alreadyBody: 'This affirmation has already been attested. Nothing more is needed from you.',
    notFoundTitle: 'This affirmation isn’t available',
    notFoundBody:
      'It may have been completed already, or this link isn’t yours to attest. If you believe this is a mistake, check the link from your notification.',
    notFoundCta: 'Go to your feed',
  },
};
