interface WorkspaceClipboardResult {
  readonly handleCopyWorkspaceId: () => Promise<void>;
}
export const useWorkspaceClipboard = (
  workspaceId: string,
): WorkspaceClipboardResult => {
  const handleCopyWorkspaceId = async (): Promise<void> => {
    await navigator.clipboard.writeText(workspaceId);
  };
  return { handleCopyWorkspaceId };
};
