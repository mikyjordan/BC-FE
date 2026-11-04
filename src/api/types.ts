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
  featured: boolean;
  publishedAt: string | null;
  purchase: PurchaseInfo;
}

export interface PublicMovie extends PublicContentBase {
  kind: 'MOVIE';
  plot: string | null;
  director: string | null;
  durationMinutes: number | null;
  italianReleaseDate: string | null;
  screeningStartDate: string | null;
  screeningEndDate: string | null;
  distributor: string | null;
  ageRating: string | null;
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

export interface HomeResponse {
  featured: PublicContent[];
  movies: PublicMovie[];
  tvSeries: PublicSeries[];
}

export interface WalletSummary {
  balance: number;
  holdingsValue: number;
  totalInvested: number;
  totalRewards: number;
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
  units: number;
  totalInvested: number;
  totalRewards: number;
  currentValue: number;
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
  featured: boolean;
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
  screeningStartDate?: string | null;
  screeningEndDate?: string | null;
  distributor?: string | null;
  ageRating?: string | null;
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
  balance: number | null;
  permissions: string[];
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
