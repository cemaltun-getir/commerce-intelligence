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
  Warehouse
} from '@/types';
import { segmentApi } from '@/utils/segmentApi';
import { warehouseApi } from '@/utils/warehouseApi';
import { indexValueApi } from '@/utils/indexValueApi';

interface AppState {
  // Product data
  products: Product[];
  competitors: Competitor[];
  competitorPrices: CompetitorPrice[];
  productMatches: ProductMatch[];
  
  // Segment data
  segments: Segment[];
  
  // Warehouse data
  warehouses: Warehouse[];
  
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
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  products: [],
  competitors: [
    { id: 'migros', name: 'migros', displayName: 'Migros' },
    { id: 'carrefour', name: 'carrefour', displayName: 'Carrefour' },
    { id: 'sok', name: 'sok', displayName: 'ŞOK' },
  ],
  competitorPrices: [],
  productMatches: [],
  segments: [],
  warehouses: [],
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
    }
  },
  
  deleteSegment: async (id) => {
    try {
      set({ loading: true });
      await segmentApi.delete(id);
      set((state) => ({
        segments: state.segments.filter(segment => segment.id !== id),
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
})); 