export type MatchLifecycleStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'RESULTED' | 'CANCELLED' | 'SUSPENDED';
export type JoiningLifecycleStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
export type AccountStandingStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface RoomAccessEligibilityCheck {
  joiningStatus?: JoiningLifecycleStatus | null;
  userStatus: AccountStandingStatus;
  matchStatus: MatchLifecycleStatus;
  matchStartTime: Date;
  currentTime?: Date;
}

export interface RoomAccessResult {
  isEligible: boolean;
  code:
    | 'ACCESS_GRANTED'
    | 'PUBLIC_OR_UNAUTHENTICATED'
    | 'UNCONFIRMED_JOINING'
    | 'PAYMENT_PENDING'
    | 'JOINING_CANCELLED'
    | 'ACCOUNT_BANNED_OR_SUSPENDED'
    | 'TOO_EARLY_LOCKED'
    | 'MATCH_RESULTED_LOCKED'
    | 'MATCH_CANCELLED_OR_SUSPENDED';
  reason: string;
  countdownSeconds?: number;
}

/**
 * Authoritative backend policy for Free Fire custom room credentials.
 * Zero ambiguity: handles every possible lifecycle combination deterministically.
 */
export class RoomCredentialsPolicy {
  public static readonly DISCLOSURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes before start

  static checkEligibility(params: RoomAccessEligibilityCheck): RoomAccessResult {
    const {
      joiningStatus,
      userStatus,
      matchStatus,
      matchStartTime,
      currentTime = new Date(),
    } = params;

    // 1. Account Standing Check
    if (userStatus === 'BANNED' || userStatus === 'SUSPENDED') {
      return {
        isEligible: false,
        code: 'ACCOUNT_BANNED_OR_SUSPENDED',
        reason: 'Account is not in good standing. Room access denied.',
      };
    }

    // 2. Joining Lifecycle Check
    if (!joiningStatus) {
      return {
        isEligible: false,
        code: 'PUBLIC_OR_UNAUTHENTICATED',
        reason: 'Confirmed slot reservation required to view room credentials.',
      };
    }

    if (joiningStatus === 'PENDING_PAYMENT') {
      return {
        isEligible: false,
        code: 'PAYMENT_PENDING',
        reason: 'Payment pending verification. Slot must be confirmed.',
      };
    }

    if (joiningStatus === 'CANCELLED' || joiningStatus === 'REFUNDED' || joiningStatus === 'REFUND_PENDING') {
      return {
        isEligible: false,
        code: 'JOINING_CANCELLED',
        reason: 'Joining has been cancelled or refunded. Room access revoked.',
      };
    }

    if (joiningStatus !== 'CONFIRMED') {
      return {
        isEligible: false,
        code: 'UNCONFIRMED_JOINING',
        reason: 'Slot is not confirmed.',
      };
    }

    // 3. Match Lifecycle & State Check
    if (matchStatus === 'CANCELLED' || matchStatus === 'SUSPENDED' || matchStatus === 'DRAFT') {
      return {
        isEligible: false,
        code: 'MATCH_CANCELLED_OR_SUSPENDED',
        reason: `Match is currently ${matchStatus.toLowerCase()}. Credentials unavailable.`,
      };
    }

    // EXPLICIT POLICY: Once RESULTED, credentials are permanently archived and hidden
    if (matchStatus === 'RESULTED') {
      return {
        isEligible: false,
        code: 'MATCH_RESULTED_LOCKED',
        reason: 'Match has concluded and results published. Room credentials archived.',
      };
    }

    // EXPLICIT POLICY: If match is ONGOING, confirmed participant can still access credentials (for late entry / reconnection)
    if (matchStatus === 'ONGOING') {
      return {
        isEligible: true,
        code: 'ACCESS_GRANTED',
        reason: 'Match is currently in progress. Access granted.',
      };
    }

    // 4. Timing Window Check for UPCOMING matches
    const timeDiffMs = matchStartTime.getTime() - currentTime.getTime();

    // If match starts more than 15 minutes away, credentials remain strictly locked
    if (timeDiffMs > this.DISCLOSURE_WINDOW_MS) {
      const countdownSeconds = Math.ceil((timeDiffMs - this.DISCLOSURE_WINDOW_MS) / 1000);
      return {
        isEligible: false,
        code: 'TOO_EARLY_LOCKED',
        countdownSeconds,
        reason: 'Room credentials unlock automatically 15 minutes prior to match drop.',
      };
    }

    // Confirmed participant within 15 minutes of start -> ACCESS GRANTED
    return {
      isEligible: true,
      code: 'ACCESS_GRANTED',
      reason: 'Room credentials unlocked.',
    };
  }

  /**
   * Strips all sensitive room credentials from public or unauthenticated objects.
   */
  static sanitizeMatchPublic<T extends Record<string, any>>(match: T): Omit<T, 'roomId' | 'roomPassword'> {
    const copy = { ...match };
    delete copy.roomId;
    delete copy.roomPassword;
    return copy;
  }
}
