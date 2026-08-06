import { UserProfile } from "../../app/contexts/app-shell-context";

export interface BackendUserDto {
  public_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  email_verified?: number;
}

/**
 * Maps the backend User DTO to the frontend UserProfile format.
 * Responsibilities are kept strictly to translation only (no presentation fallbacks).
 *
 * @param dto - The backend user DTO object
 * @returns The frontend UserProfile object
 */
export function mapUserDto(dto: BackendUserDto): UserProfile {
  return {
    id: dto.public_id,
    fullName: dto.name,
    username: dto.name.toLowerCase().replace(/\s+/g, "_"),
    email: dto.email,
    avatar: dto.avatar_url || undefined,
  };
}
