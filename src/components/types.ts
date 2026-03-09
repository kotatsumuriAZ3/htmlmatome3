export interface ExtractedElement {
  id: string;
  originalHtml: string;
  processedHtml: string;
  isSelected: boolean;
  parentId: string | null;
  referencedId: string | null;
  isManuallyMoved: boolean;
  isNewTag: boolean;
  children: ExtractedElement[];
  appliedTextColor: string | null;
  isBold: boolean;
  hasBorder: boolean;
  isAA: boolean;
  isText: boolean;
  hasBr: boolean;
  uid: string | null;
  uidCount: string | null;
}

export interface ElementUpdatePayload {
  id: string;
  updates: Partial<ExtractedElement>;
}

export interface ProcessOptions {
  stripPostHeaderTags?: boolean;
  stripPostUsernameParentheses?: boolean;
  saveWithAddBrTags?: boolean;
  textColor?: string | null;
  isBold?: boolean;
  hasBorder?: boolean;
  isAA?: boolean;
  isText?: boolean;
  parentId?: string | null;
  hasBr?: boolean;
}
