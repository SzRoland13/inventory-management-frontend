import { useMemo, useRef, useCallback } from 'react';
import { FieldValues, UseFormWatch } from 'react-hook-form';
import { deepEqual } from 'fast-equals';

export function useFormChanges<T extends FieldValues>(watch: UseFormWatch<T>) {
  const initialValuesRef = useRef<T | null>(null);

  const values = watch();

  const setInitialValues = useCallback((values: T) => {
    initialValuesRef.current = values;
  }, []);

  const hasChanges = useMemo(() => {
    if (!initialValuesRef.current) return false;

    return !deepEqual(values, initialValuesRef.current);
  }, [values]);

  return { hasChanges, setInitialValues };
}
