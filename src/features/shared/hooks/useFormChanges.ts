import { useCallback, useMemo, useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { deepEqual } from 'fast-equals';

export function useFormChanges<T extends FieldValues>(values: T) {
  const [initialValues, setInitialValuesState] = useState<T | null>(null);

  const setInitialValues = useCallback((values: T) => {
    setInitialValuesState(values);
  }, []);

  const resetToInitial = useCallback(() => {
    return initialValues;
  }, [initialValues]);

  const hasChanges = useMemo(() => {
    if (!initialValues) return false;

    return !deepEqual(values, initialValues);
  }, [values, initialValues]);

  return { hasChanges, setInitialValues, resetToInitial };
}
