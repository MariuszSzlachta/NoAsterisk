// Spans at or above this threshold are auto-accepted without manual review (architecture doc § 4 step 5)
export const AUTO_ACCEPT_THRESHOLD = 0.9;

// Spans below this threshold are too uncertain to mask but force needs_review status
export const REVIEW_THRESHOLD = 0.7;
