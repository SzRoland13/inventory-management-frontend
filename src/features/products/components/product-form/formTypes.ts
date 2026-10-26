import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProductFormValues } from '@/features/products/schemas/productSchemas';

export type ProductFormFields = {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
};
