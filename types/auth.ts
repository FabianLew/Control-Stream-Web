export type MeResponseDto = {
  userId: string;
  email: string;
  currentWorkspaceId?: string | null;
};

export type AuthResponseDto = {
  accessToken: string;
};
