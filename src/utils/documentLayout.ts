// Shared layout constants for PDF and Spreadsheet document generation
// Keep formatting consistent with InvoicePreview.tsx

export const PAGE = {
  unit: 'pt' as const,
  format: 'letter' as const,
  marginX: 72, // matches px-[72px] in preview (1 inch)
  marginY: 72,
};

export const HEADERS = {
  invoice: ['DATE', 'PROJECT', 'TASK', 'HOURS', 'RATE', 'AMOUNT'],
  timecard: ['DATE', 'PROJECT', 'TASK', 'HOURS'],
} as const;

// Column span ratios based on preview grids
export const GRID_SPANS = {
  invoice: [2, 3, 3, 1, 1, 2], // total 12
  timecard: [2, 3, 2, 1], // total 8
} as const;

// Pixel offsets used in preview to fine-tune layout
export const OFFSETS = {
  invoice: {
    task: -25, // matches -ml-[25px]
    ratePadding: 75, // matches pl-[75px]
    billToTitleOffset: -15, // matches -ml-[15px]
  },
  timecard: {
    task: 0,
  },
} as const;

export const FONTS = {
  title: 20,
  meta: 10,
  header: 8,
  body: 10,
  footer: 6,
} as const;

export const BRAND = {
  icon: '/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png',
  wordmark: '/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png',
} as const;
