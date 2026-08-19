export type Dictionary = {
  nav: {
    home: string;
    pricing: string;
    dashboard: string;
    subscriptionTab: string;
    signIn: string;
  };
  landing: {
    badge: string;
    heroLine1: string;
    heroHighlight: string;
    heroSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    productLabel: string;
    productAlt: string;
    videoLabel: string;
    disclaimer: string;
    stats: { value: string; unit: string; label: string }[];
    stepsHeading: string;
    steps: { title: string; body: string }[];
    featuresHeading: string;
    features: { title: string; body: string }[];
    faqHeading: string;
    faqs: { q: string; a: string }[];
    finalHeading: string;
    finalSubtext: string;
  };
  pricing: {
    heading: string;
    subtext: string;
    perMonth: string;
    mostPopular: string;
    cta: string;
    taglineStarter: string;
    taglineCreator: string;
    taglinePro: string;
    creditsPerMonth: (n: number) => string;
    cost720p: (n: number) => string;
    cost1080p: (n: number) => string;
    max1080p: (n: number) => string;
    priorityProcessing: string;
    teamMembers: string;
  };
  common: {
    subscribed: string;
    cancel: string;
    close: string;
    ok: string;
    confirm: string;
    loading: string;
    delete: string;
    deleting: string;
    waitingForPayment: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    historyHeading: string;
    recordsCount: (n: number) => string;
    emptyHistory: string;
  };
  generationForm: {
    title: string;
    productImageLabel: string;
    productImageAlt: string;
    productNameLabel: string;
    productNamePlaceholder: string;
    extraImagesLabel: string;
    optional: string;
    extraImageAlt: (n: number) => string;
    removeImageAria: string;
    avatarLabel: string;
    avatarAlt: string;
    aspectRatioLabel: string;
    resolutionLabel: string;
    durationLabel: string;
    seconds: string;
    credits: string;
    remainingCredits: (remaining: string, total: string) => string;
    promptLabel: string;
    promptPlaceholder: string;
    submitting: string;
    submit: string;
    errorMissingFields: string;
    errorImageUpload: string;
    errorAvatarUpload: string;
    errorExtraImageUpload: string;
    errorCreateFailed: string;
  };
  generationCard: {
    deleteConfirm: (name: string) => string;
    deleteTitle: string;
    videosReady: (done: number, total: number) => string;
    deleteAria: string;
  };
  generationDetail: {
    deleteConfirm: (name: string) => string;
    deleteTitle: string;
    deleteVariantConfirm: (n: number) => string;
    deleteVariantTitle: string;
    notFound: string;
    backToDashboard: string;
    extraImageAlt: (n: number) => string;
    avatarAlt: string;
    deleteVariantAria: string;
    failedStatus: string;
    generatingStatus: string;
    variantLabel: (n: number) => string;
    downloadAria: string;
  };
  subscriptionPanel: {
    activePlan: string;
    noSubscription: string;
    viewPlans: string;
    creditsRemaining: (n: string) => string;
    creditsUsed: (used: string, total: string) => string;
    cancelledUntil: (date: string) => string;
    renewsOn: (date: string) => string;
    upgradePlan: string;
  };
  accountSubscription: {
    cancelConfirm: string;
    cancelTitle: string;
    confirmCancel: string;
    noActiveSubscription: string;
    activePlan: string;
    creditsRemaining: (used: string, total: string) => string;
    cancelledMessage: (date: string) => string;
    resume: string;
    nextRenewal: (date: string) => string;
    cancelButton: string;
    finePrint: (date: string) => string;
  };
  toast: {
    subscribed: string;
  };
  upgradeModal: {
    heading: string;
    body: string;
    viewPlans: string;
  };
  auth: {
    signUpLink: string;
    signInLink: string;
  };
  statusBadge: {
    pending: string;
    processing: string;
    completed: string;
    failed: string;
  };
};
