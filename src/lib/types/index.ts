// Types matching future Salesforce objects

export interface Project {
  id: string;
  name: string;
  nameAr: string;
  /** Salesforce Province_Region__c — used for filters & forms */
  provinceRegion?: string;
  /** Salesforce City__c */
  city?: string;
  /** Salesforce Project_Type__c — e.g. Residential, Commercial */
  projectType?: string;
  location: string;
  locationAr: string;
  coverImageUrl: string;
  featuredVideoUrl: string;
  status: "Active" | "Completed";
  description?: string;
  descriptionAr?: string;
  mapCentroidLat?: number;
  mapCentroidLng?: number;
  mapGeometryJson?: unknown;
  /** From Map_Show_On_Map__c — Sakani map visibility */
  showOnMap?: boolean;
  /** Salesforce Office_Location__c — sales office map link */
  officeLocationUrl?: string;
  /** Salesforce Project_Location__c — project site map (embed / Google Maps URL) */
  projectLocationUrl?: string;
  logoUrl?: string;
  topPlanUrl?: string;
  brochureUrl?: string;
  notes?: ProjectNote[];
  attachments?: ProjectAttachment[];
  gallery?: Array<{ url: string; tagEn: string; tagAr: string; }>;
  /** Content files whose title ends with model-1 … model-10 */
  modelFiles?: ProjectModelFile[];
  /** Curated nearby places from Salesforce Nearby_Location__c */
  nearbyLocations?: ProjectNearbyLocation[];
  phases: Phase[];
}

/** Unit footprint for interactive project map (Sakani / Map_* fields). */
export interface ProjectMapUnit {
  id: string;
  name: string;
  status: string;
  statusGroup: 'available' | 'reserved' | 'sold' | 'blocked' | 'unknown';
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  bua?: number;
  buildingName?: string;
  phaseName?: string;
  mapCentroidLat?: number;
  mapCentroidLng?: number;
  mapGeometryJson?: unknown;
  showOnMap?: boolean;
}

export type NearbyLocationCategory =
  | 'Train Station'
  | 'Airport'
  | 'Bank'
  | 'Chamber of Commerce'
  | 'Port'
  | 'University'
  | 'School'
  | 'Library'
  | 'Hospital'
  | 'Mall'

export interface ProjectNearbyLocation {
  id: string
  name: string
  nameAr: string
  category: NearbyLocationCategory | string
  /** Drive time in minutes — omitted until Minutes__c exists in Salesforce */
  estimatedMinutes?: number
}

export interface ProjectModelFile {
  id: string;
  number: number;
  title: string;
  url: string;
  fileExtension?: string;
}

export interface ProjectAttachment {
  id: string;
  title: string;
  fileExtension?: string;
  fileType?: string;
  url: string;
}

export interface ProjectNote {
  id: string;
  title: string;
  url: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  nameAr: string;
  status: "Available" | "SoldOut";
  availableUnitsCount: number;
}

export interface Unit {
  id: string;
  projectId: string;
  phaseId: string;
  unitNumber: string;
  /** Salesforce Model__c */
  model?: string;
  externalId?: string;
  price: number;
  finalPrice?: number;
  status: "Available" | "Reserved" | "Sold" | "Contracted" | "On-Hold" | "Blocked";
  bedrooms: number;
  bathrooms?: number;
  area: number;
  bua?: number;
  floor?: number;
  finishing?: string;
  usageType?: string;
  view?: string;
  hasGarden?: boolean;
  hasLand?: boolean;
  hasRoof?: boolean;
  hasOutdoor?: boolean;
  gardenArea?: number;
  landArea?: number;
  roofArea?: number;
  outdoorArea?: number;
  eligibleForSubsidies?: boolean;
  subsidies?: string;
  deliveryDate?: string;
  images: string[];
  unitImage?: string;
  projectHeroImage?: string;
  floorPlan?: string;
  sketchupEmbedUrl?: string;
  amenities?: string[];
  description?: string;
  descriptionAr?: string;
  projectName?: string;
  projectNameAr?: string;
  /** Derived from parent project Project_Type__c — e.g. Residential, Commercial */
  propertyType?: string;
  /** From `Project__r` on unit query — used when lead form can’t match `getProjects()` */
  projectProvinceRegion?: string;
  projectCity?: string;
  phaseName?: string;
  phaseNameAr?: string;
  buildingName?: string;
  blockName?: string;
  notes?: any[];
  paymentProgress?: number; // 0-100
  paymentStatus?: string;
}

export interface Lead {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile?: "Investor" | "Customer" | "Supplier";
  source: "PWA";
  interestedProjectId?: string;
  /** Lead.Interested_Projects__c — project display name (picklist value) */
  interestedProjectName?: string;
  interestedPhaseId?: string;
  interestedUnitId?: string;
  company?: string;
  /** Lead.Project__c — rental/commercial project lookup */
  rentalProjectId?: string;
  /** Lead.Rental_Budget__c */
  rentalBudget?: number;
  /** Lead.Number_of_Rooms__c */
  numberOfRooms?: number;
  /** Lead.Rental_Start_Date__c (YYYY-MM-DD) */
  rentalStartDate?: string;
  /** Lead.Rental_End_Date__c (YYYY-MM-DD) */
  rentalEndDate?: string;
  message?: string;
  createdAt?: string;
}

export interface Contact {
  id: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownedUnits: string[];
}

export interface Case {
  id: string;
  contactId: string;
  unitId?: string;
  subject: string;
  category: CaseCategory;
  description: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export type CaseCategory =
  | "Maintenance"
  | "Inquiry"
  | "Complaint"
  | "Documentation"
  | "Other";

export type CaseStatus = "New" | "InProgress" | "Resolved" | "Closed";

export interface UnitFilters {
  projectId?: string;
  phaseId?: string;
  buildingId?: string;
  blockId?: string;
  projectName?: string;
  /** Salesforce Model__c */
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minTotalArea?: number;
  maxTotalArea?: number;
  minBUA?: number;
  maxBUA?: number;
  status?: Unit["status"];
  usageType?: string;
  /** Salesforce Project_Type__c on parent project — Residential | Commercial */
  projectType?: string;
  finishing?: string;
  city?: string;
  province?: string;
  hasGarden?: boolean;
  hasLand?: boolean;
  hasRoof?: boolean;
  hasOutdoor?: boolean;
  eligibleForSubsidies?: boolean;
  searchText?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
}

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug?: string;
  publicationDate?: string;
  segment?: string;
  coverImageUrl?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  lastModified?: string;
  body?: string;
}

export interface NewsFilters {
  page?: number;
  pageSize?: number;
  year?: string;
  month?: string;
  segment?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}


