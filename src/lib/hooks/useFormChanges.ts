import { useMemo, useRef, useCallback } from 'react';
import { FieldValues } from 'react-hook-form';
import { deepEqual } from 'fast-equals';

export function useFormChanges<T extends FieldValues>(values: T) {
  const initialValuesRef = useRef<T | null>(null);

  const setInitialValues = useCallback((values: T) => {
    initialValuesRef.current = values;
  }, []);

  const hasChanges = useMemo(() => {
    if (!initialValuesRef.current) return false;

    return !deepEqual(values, initialValuesRef.current);
  }, [values]);

  return { hasChanges, setInitialValues };
}
