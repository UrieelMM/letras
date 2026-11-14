const paths = {
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  folderPlus: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 13h6m-3-3v6',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  search: 'M16 16l4 4m-2-9a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 2-2 7 6 M16 9h.01',
  video: 'M4 5h16v14H4z M10 9l5 3-5 3z',
  close: 'm6 6 12 12M6 18 18 6',
  trash: 'M3 6h18m-2 0-1 14H6L5 6m4 0V3h6v3m-5 4v6m4-6v6',
} as const;

export function ResourceIcon({ name, className = 'h-5 w-5' }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
