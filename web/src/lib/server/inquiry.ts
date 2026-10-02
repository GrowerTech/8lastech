export const InquiryInclude = {
  service: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;
