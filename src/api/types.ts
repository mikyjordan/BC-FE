export type Role = 'USER' | 'ADMIN' | 'SUPERADMIN';
export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED';

export interface Me {
  id: string;
  email: string;
  username: string;
  role: Role;
  permissions: string[];
  createdAt: string;
  profile: {
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    notificationPreferences: { email: boolean; inApp: boolean };
  } | null;
}

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  user: Me;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PurchaseInfo {
  priceBc: number | null;
  purchasable: boolean;
  reason: string | null;
  message?: string | null;
  opensAt?: string | null;
  closesAt?: string | null;
}

interface PublicContentBase {
  id: string;
  title: string;
  originalTitle: string | null;
  posterUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  genres: string[];
  cast: string[];
  productionCountry: string | null;
  publishedAt: string | null;
  purchase: PurchaseInfo;
}

export interface PublicMovie extends PublicContentBase {
  kind: 'MOVIE';
  plot: string | null;
  director: string | null;
  durationMinutes: number | null;
  italianReleaseDate: string | null;
  distributor: string | null;
  ageRating: string | null;
  boxOffice: { currentGross: number | null; recordedAt: string | null };
  /** Uscita dalle sale: a questa data il film viene riscattato automaticamente. */
  autoRedeemAt: string | null;
  outOfTheaters: boolean;
}

export interface BoxOfficeReading {
  id?: string;
  grossAmount: number;
  recordedAt: string;
  source: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface PublicSeason {
  id: string;
  seasonNumber: number;
  title: string | null;
  releaseDate: string | null;
  episodesCount: number | null;
  purchase: PurchaseInfo;
}

export interface PublicSeries extends PublicContentBase {
  kind: 'TV_SERIES';
  creator: string | null;
  platforms: string[];
  firstReleaseDate: string | null;
  seriesStatus: 'ANNOUNCED' | 'ONGOING' | 'ENDED' | 'CANCELLED';
  seasonsCount: number | null;
  episodesCount: number | null;
  holdingScope: 'SERIES' | 'SEASON';
  monitoredSeasonId: string | null;
  dataSource: string | null;
  seasons?: PublicSeason[];
}

export type PublicContent = PublicMovie | PublicSeries;

/** Sezioni attivate dal Superadmin. */
export interface Features {
  movies: boolean;
  tvSeries: boolean;
}

export interface HomeResponse {
  features: Features;
  movies: PublicMovie[];
  tvSeries: PublicSeries[];
}

export interface WalletSummary {
  balance: number;
  holdingsValue: number;
  totalInvested: number;
  realizedGain: number;
  unrealizedGain: number;
  totalGain: number;
  returnPct: number;
  distribution: {
    movies: { invested: number; value: number; count: number };
    tvSeries: { invested: number; value: number; count: number };
  };
}

export interface Holding {
  id: string;
  contentType: 'MOVIE' | 'TV_SERIES';
  contentId: string;
  seasonId: string | null;
  seasonNumber: number | null;
  title: string;
  posterUrl: string | null;
  available: boolean;
  status: 'OPEN' | 'REDEEMED';
  units: number;
  purchasePrice: number;
  totalInvested: number;
  totalRewards: number;
  /** Solo film: incasso attuale in Bustercoin (1 € = 1 B); null se non ancora inserito. */
  currentGross: number | null;
  currentGrossAt: string | null;
  currentValue: number;
  /** Guadagno (+) o perdita (−); null se l'incasso non è ancora disponibile. */
  profit: number | null;
  trend: 'UP' | 'DOWN' | 'EVEN' | 'UNKNOWN';
  redeemable: boolean;
  redeemedAt: string | null;
  redeemedAmount: number | null;
  redeemedBy: 'USER' | 'AUTO' | null;
  autoRedeemAt: string | null;
  firstPurchasedAt: string;
  lastPurchaseAt: string | null;
}

export interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  movieId: string | null;
  tvSeriesId: string | null;
  tvSeasonId: string | null;
  relatedTransactionId: string | null;
  createdAt: string;
}

export interface RedeemResult {
  replayed: boolean;
  holdingId: string;
  purchasePrice: number;
  grossAmount: number;
  profit: number;
  balanceAfter: number;
}

export interface PurchaseResult {
  replayed: boolean;
  purchaseId: string;
  units: number;
  unitPrice: number;
  amount: number;
  balanceAfter: number;
  transactionId: string;
}

/** Record amministrativo completo (tutti gli stati). */
export interface AdminContent {
  id: string;
  title: string;
  originalTitle: string | null;
  posterUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  genres: string[];
  castMembers: string[];
  productionCountry: string | null;
  publicationStatus: PublicationStatus;
  publishedAt: string | null;
  availableFrom: string | null;
  scheduledPublishAt: string | null;
  purchasesEnabled: boolean;
  purchaseOpensAt: string | null;
  purchaseClosesAt: string | null;
  priceBc: number | null;
  showOnHomepage: boolean;
  showInLeaderboards: boolean;
  adminNotes: string | null;
  source: string;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
  // film
  plot?: string | null;
  director?: string | null;
  durationMinutes?: number | null;
  italianReleaseDate?: string | null;
  distributor?: string | null;
  ageRating?: string | null;
  latestGross?: number | null;
  latestGrossAt?: string | null;
  latestGrossReadingId?: string | null;
  autoRedeemAt?: string | null;
  autoRedeemedAt?: string | null;
  notifyOnPublish: boolean;
  notificationQueuedAt: string | null;
  notificationRecipients: number | null;
  // serie
  creator?: string | null;
  platforms?: string[];
  firstReleaseDate?: string | null;
  seriesStatus?: string;
  seasonsCount?: number | null;
  episodesCount?: number | null;
  holdingScope?: 'SERIES' | 'SEASON';
  dataSource?: string | null;
}

export interface AdminSeason {
  id: string;
  seriesId: string;
  seasonNumber: number;
  title: string | null;
  releaseDate: string | null;
  episodesCount: number | null;
  priceBc: number | null;
  purchasesEnabled: boolean;
}

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  balance: number | null;
  permissions: string[];
}

/** Bonus configurati dal Superadmin (Amministrazione → Impostazioni). */
/** Periodo in cui l'incasso si può modificare: dall'uscita in sala al riscatto di tutti. */
export interface BoxOfficeWindow {
  editable: boolean;
  code: 'OPEN' | 'BOX_OFFICE_NO_RELEASE_DATE' | 'BOX_OFFICE_NOT_YET' | 'BOX_OFFICE_CLOSED';
  message: string | null;
  opensOn: string | null;
  holdings: { total: number; open: number };
}

export interface EconomySettings {
  initialBonus: number;
  weeklyBonus: number;
}

export interface UserDeletionPreview {
  id: string;
  username: string;
  email: string;
  role: Role;
  balance: number;
  transactions: number;
  holdings: number;
  openHoldings: number;
  deletable: boolean;
}

export interface ContentNotificationStats {
  notifyOnPublish: boolean;
  queuedAt: string | null;
  recipients: number | null;
  pending: number;
  sent: number;
  skipped: number;
  failed: number;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  createdAt: string;
}

export type ContentKindPath = 'movies' | 'tv-series';
