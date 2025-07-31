import { create } from 'zustand';
import { 
  Product, 
  Competitor, 
  CompetitorPrice, 
  ProductMatch, 
  Segment, 
  IndexValue, 
  BoundaryRule,
  ProductFilter,
  SegmentFilter,
  Warehouse,
  PriceLocation,
  Category,
  SubCategory
} from '@/types';
import { segmentApi } from '@/utils/segmentApi';
import { warehouseApi } from '@/utils/warehouseApi';
import { indexValueApi } from '@/utils/indexValueApi';
import { externalApi } from '@/utils/externalApi';

interface AppState {
  // Product data
  products: Product[];
  competitors: Competitor[];
  competitorPrices: CompetitorPrice[];
  productMatches: ProductMatch[];
  
  // Category data
  categories: Category[];
  subCategories: SubCategory[];
  
  // Segment data
  segments: Segment[];
  
  // Warehouse data
  warehouses: Warehouse[];
  
  // Price Location data
  priceLocations: PriceLocation[];
  
  // Index matrix data
  indexValues: IndexValue[];
  
  // Boundary rules
  boundaryRules: BoundaryRule[];
  
  // UI state
  activeCompetitor: string;
  activeSalesChannel: 'getir' | 'getirbuyuk';
  productFilter: ProductFilter;
  segmentFilter: SegmentFilter;
  loading: boolean;
  
  // Actions
  setActiveCompetitor: (competitorId: string) => void;
  setActiveSalesChannel: (channel: 'getir' | 'getirbuyuk') => void;
  setProductFilter: (filter: Partial<ProductFilter>) => void;
  setSegmentFilter: (filter: Partial<SegmentFilter>) => void;
  setLoading: (loading: boolean) => void;
  
  // Segment actions
  fetchSegments: () => Promise<void>;
  addSegment: (segment: Omit<Segment, 'id' | 'lastUpdated' | 'domains' | 'provinces' | 'districts' | 'demographies' | 'sizes'>) => Promise<void>;
  updateSegment: (id: string, segment: Partial<Omit<Segment, 'id'>>) => Promise<void>;
  deleteSegment: (id: string) => Promise<void>;
  
  // Index actions
  updateIndexValue: (segmentId: string, kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground', competitorId: string, value: number) => void;
  fetchIndexValues: () => Promise<void>;
  saveIndexValue: (segmentId: string, kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground', competitorId: string, value: number) => Promise<void>;
  
  // Boundary rule actions
  addBoundaryRule: (rule: BoundaryRule) => void;
  updateBoundaryRule: (id: string, updatedRule: Partial<BoundaryRule>) => void;
  deleteBoundaryRule: (id: string) => void;
  
  // Warehouse actions
  fetchWarehouses: () => Promise<void>;
  getWarehousesByFilters: (filters: {
    province?: string;
    district?: string;
    domain?: string;
    demography?: string;
    size?: string;
  }) => Promise<Warehouse[]>;
  
  // Price Location actions
  fetchPriceLocations: () => Promise<void>;
  
  // External API actions
  fetchProducts: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  fetchCompetitorPrices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSubCategories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  products: [],
  competitors: [],
  competitorPrices: [],
  productMatches: [],
  categories: [],
  subCategories: [],
  segments: [],
  warehouses: [],
  priceLocations: [],
  indexValues: [],
  boundaryRules: [],
  
  // UI state
  activeCompetitor: 'migros',
  activeSalesChannel: 'getir',
  productFilter: {},
  segmentFilter: {},
  loading: false,
  
  // Actions
  setActiveCompetitor: (competitorId) => set({ activeCompetitor: competitorId }),
  setActiveSalesChannel: (channel) => set({ activeSalesChannel: channel }),
  setProductFilter: (filter) => set({ productFilter: { ...get().productFilter, ...filter } }),
  setSegmentFilter: (filter) => set({ segmentFilter: { ...get().segmentFilter, ...filter } }),
  setLoading: (loading) => set({ loading }),
  
  // Segment actions
  fetchSegments: async () => {
    try {
      set({ loading: true });
      const segments = await segmentApi.getAll();
      set({ segments, loading: false });
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      set({ loading: false });
    }
  },

  addSegment: async (segment) => {
    try {
      set({ loading: true });
      const newSegment = await segmentApi.create(segment);
      set((state) => ({ 
        segments: [...state.segments, newSegment],
        loading: false
      }));
    } catch (error) {
      console.error('Failed to add segment:', error);
      set({ loading: false });
      throw error; // Re-throw to allow UI components to handle the error
    }
  },
  
  updateSegment: async (id, updatedSegment) => {
    try {
      set({ loading: true });
      const updated = await segmentApi.update(id, updatedSegment);
      set((state) => ({
        segments: state.segments.map(segment => 
          segment.id === id ? updated : segment
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Failed to update segment:', error);
      set({ loading: false });
      throw error; // Re-throw to allow UI components to handle the error
    }
  },
  
  deleteSegment: async (id) => {
    try {
      set({ loading: true });
      await segmentApi.delete(id);
      set((state) => ({
        segments: state.segments.filter(segment => segment.id !== id),
        indexValues: state.indexValues.filter(iv => iv.segmentId !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Failed to delete segment:', error);
      set({ loading: false });
    }
  },
  
  updateIndexValue: (segmentId, kviType, competitorId, value) => {
    // Update local state immediately for UI responsiveness
    set((state) => {
      const existingIndex = state.indexValues.findIndex(
        iv => iv.segmentId === segmentId && 
             iv.kviType === kviType as any && 
             iv.competitorId === competitorId &&
             iv.salesChannel === state.activeSalesChannel
      );
      
      const newIndexValue: IndexValue = {
        segmentId,
        kviType: kviType as any,
        competitorId,
        value,
        salesChannel: state.activeSalesChannel,
      };
      
      if (existingIndex >= 0) {
        const newIndexValues = [...state.indexValues];
        newIndexValues[existingIndex] = newIndexValue;
        return { indexValues: newIndexValues };
      } else {
        return { indexValues: [...state.indexValues, newIndexValue] };
      }
    });
    
    // Save to database asynchronously
    get().saveIndexValue(segmentId, kviType, competitorId, value).catch(error => {
      console.error('Failed to save index value to database:', error);
    });
  },

  fetchIndexValues: async () => {
    try {
      set({ loading: true });
      const indexValues = await indexValueApi.getAll();
      set({ indexValues, loading: false });
    } catch (error) {
      console.error('Failed to fetch index values:', error);
      set({ loading: false });
    }
  },

  saveIndexValue: async (segmentId, kviType, competitorId, value) => {
    try {
      const { activeSalesChannel } = get();
      const indexValue: IndexValue = {
        segmentId,
        kviType,
        competitorId,
        value,
        salesChannel: activeSalesChannel,
      };
      
      await indexValueApi.createOrUpdate(indexValue);
    } catch (error) {
      console.error('Failed to save index value:', error);
      throw error;
    }
  },
  
  addBoundaryRule: (rule) => set((state) => ({ 
    boundaryRules: [...state.boundaryRules, rule] 
  })),
  
  updateBoundaryRule: (id, updatedRule) => set((state) => ({
    boundaryRules: state.boundaryRules.map(rule => 
      rule.id === id ? { ...rule, ...updatedRule } : rule
    )
  })),
  
  deleteBoundaryRule: (id) => set((state) => ({
    boundaryRules: state.boundaryRules.filter(rule => rule.id !== id)
  })),

  // Warehouse actions
  fetchWarehouses: async () => {
    try {
      set({ loading: true });
      const warehouses = await warehouseApi.getAll();
      set({ warehouses, loading: false });
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      set({ loading: false });
    }
  },

  getWarehousesByFilters: async (filters) => {
    try {
      return await warehouseApi.getByFilters(filters);
    } catch (error) {
      console.error('Failed to fetch warehouses by filters:', error);
      return [];
    }
  },

  // Price Location actions
  fetchPriceLocations: async () => {
    try {
      set({ loading: true });
      const priceLocations = await segmentApi.getPriceLocations();
      set({ priceLocations, loading: false });
    } catch (error) {
      console.error('Failed to fetch price locations:', error);
      set({ loading: false });
    }
  },

  // External API actions
  fetchProducts: async () => {
    try {
      set({ loading: true });
      const products = await externalApi.getProducts();
      set({ products, loading: false });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      set({ loading: false });
    }
  },

  fetchVendors: async () => {
    try {
      set({ loading: true });
      const competitors = await externalApi.getVendors();
      set({ competitors, loading: false });
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      set({ loading: false });
    }
  },

  fetchCompetitorPrices: async () => {
    try {
      set({ loading: true });
      const competitorPrices = await externalApi.getPriceMappings();
      set({ competitorPrices, loading: false });
    } catch (error) {
      console.error('Failed to fetch competitor prices:', error);
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      set({ loading: true });
      const categories = await externalApi.getCategories();
      set({ categories, loading: false });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({ loading: false });
    }
  },

  fetchSubCategories: async () => {
    try {
      set({ loading: true });
      const subCategories = await externalApi.getSubCategories();
      set({ subCategories, loading: false });
    } catch (error) {
      console.error('Failed to fetch sub-categories:', error);
      set({ loading: false });
    }
  },
})); 