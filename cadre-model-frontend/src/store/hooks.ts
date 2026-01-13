import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// 使用这些类型化的hooks代替普通的useDispatch和useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
