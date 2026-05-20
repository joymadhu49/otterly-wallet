import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

type Account = {
  address: string;
  name: string;
  type: 'hd' | 'simple';
  index?: number;
  keyringId: number;
};

type StateShape = {
  bootstrapped: boolean;
  hasVault: boolean;
  locked: boolean;
  accounts: Account[];
  selectedAddress?: string;
  balances: any[];
  loadingBalances: boolean;
  history: any[];
};

const initial: StateShape = {
  bootstrapped: false,
  hasVault: false,
  locked: true,
  accounts: [],
  selectedAddress: undefined,
  balances: [],
  loadingBalances: false,
  history: [],
};

const slice = createSlice({
  name: 'wallet',
  initialState: initial,
  reducers: {
    setBootstrap(state, action: PayloadAction<Partial<StateShape>>) {
      Object.assign(state, action.payload, { bootstrapped: true });
    },
    setLocked(state, action: PayloadAction<boolean>) {
      state.locked = action.payload;
    },
    setAccounts(state, action: PayloadAction<Account[]>) {
      state.accounts = action.payload;
    },
    setSelected(state, action: PayloadAction<string>) {
      state.selectedAddress = action.payload;
    },
    setBalances(state, action: PayloadAction<any[]>) {
      state.balances = action.payload;
    },
    setLoadingBalances(state, action: PayloadAction<boolean>) {
      state.loadingBalances = action.payload;
    },
    setHistory(state, action: PayloadAction<any[]>) {
      state.history = action.payload;
    },
  },
});

export const actions = slice.actions;

export const store = configureStore({
  reducer: slice.reducer,
  middleware: (gdm) => gdm({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
