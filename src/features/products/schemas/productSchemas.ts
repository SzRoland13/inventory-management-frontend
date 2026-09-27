import { z } from 'zod';
import {
  ProductAttributeDefinition,
  ProductAttributeValueRequest,
  ProductAttributeValueType,
  ProductRequest,
  ProductStatus,
} from '@/features/products/types/product';

const invalid = (key: string) => ({ error: key });

function decimalText(
  field: string,
  integerDigits: number,
  fractionDigits: number,
  required = false,
  nonNegative = true,
) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (!value) {
        if (required) {
          context.addIssue({
            code: 'custom',
            message: 'pages.products.validation.required',
          });
        }
        return;
      }

      const sign = nonNegative ? '' : '-?';
      const pattern = new RegExp(
        `^${sign}\\d{1,${integerDigits}}(?:\\.\\d{1,${fractionDigits}})?$`,
      );
      if (!pattern.test(value)) {
        context.addIssue({
          code: 'custom',
          message: `pages.products.validation.${field}`,
        });
        return;
      }

      if (nonNegative && Number(value) < 0) {
        context.addIssue({
          code: 'custom',
          message: 'pages.products.validation.non-negative',
        });
      }
    });
}

const productFormBaseSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, invalid('pages.products.validation.required'))
    .max(100, invalid('pages.products.validation.too-long')),
  ean: z.string().trim().max(20, invalid('pages.products.validation.too-long')),
  name: z
    .string()
    .trim()
    .min(1, invalid('pages.products.validation.required'))
    .max(255, invalid('pages.products.validation.too-long')),
  description: z.string(),
  brandId: z.string(),
  status: z.enum([
    ProductStatus.ACTIVE,
    ProductStatus.DRAFT,
    ProductStatus.DISCONTINUED,
  ]),
  mainUnitId: z
    .string()
    .min(1, invalid('pages.products.validation.required'))
    .regex(/^[1-9]\d*$/, invalid('pages.products.validation.positive')),
  secondaryUnitId: z.string(),
  secondaryUnitsPerMainUnit: decimalText('decimal-precision', 16, 8),
  currencyId: z.string(),
  netPrice: decimalText('decimal-precision', 16, 8, true),
  costPrice: decimalText('decimal-precision', 16, 8),
  vatRate: decimalText('vat-rate', 2, 3, true),
  weight: decimalText('dimension-precision', 12, 3),
  width: decimalText('dimension-precision', 12, 3),
  height: decimalText('dimension-precision', 12, 3),
  depth: decimalText('dimension-precision', 12, 3),
  categoryIds: z.array(z.string()),
  attributes: z.array(
    z.object({
      definitionId: z.number().int().positive(),
      value: z.string(),
    }),
  ),
});

export type ProductFormValues = z.infer<typeof productFormBaseSchema>;

export function createProductFormSchema(
  definitions: ProductAttributeDefinition[],
) {
  return productFormBaseSchema.superRefine((values, context) => {
    const mainUnitId = Number(values.mainUnitId);
    const hasSecondaryId = values.secondaryUnitId !== '';
    const hasConversion = values.secondaryUnitsPerMainUnit !== '';

    if (hasSecondaryId !== hasConversion) {
      context.addIssue({
        code: 'custom',
        path: [
          hasSecondaryId ? 'secondaryUnitsPerMainUnit' : 'secondaryUnitId',
        ],
        message: 'pages.products.validation.invalid-unit-configuration',
      });
    }

    if (hasSecondaryId) {
      const secondaryUnitId = Number(values.secondaryUnitId);
      if (!Number.isInteger(secondaryUnitId) || secondaryUnitId <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['secondaryUnitId'],
          message: 'pages.products.validation.positive',
        });
      } else if (secondaryUnitId === mainUnitId) {
        context.addIssue({
          code: 'custom',
          path: ['secondaryUnitId'],
          message: 'pages.products.validation.invalid-unit-configuration',
        });
      }
      if (hasConversion && Number(values.secondaryUnitsPerMainUnit) <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['secondaryUnitsPerMainUnit'],
          message: 'pages.products.validation.positive',
        });
      }
    }

    if (
      values.currencyId &&
      (!/^\d+$/.test(values.currencyId) || Number(values.currencyId) <= 0)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['currencyId'],
        message: 'pages.products.validation.positive',
      });
    }

    if (values.brandId && (!/^\d+$/.test(values.brandId) || Number(values.brandId) <= 0)) {
      context.addIssue({
        code: 'custom',
        path: ['brandId'],
        message: 'pages.products.validation.positive',
      });
    }

    values.categoryIds.forEach((categoryId, index) => {
      if (!/^\d+$/.test(categoryId) || Number(categoryId) <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['categoryIds', index],
          message: 'pages.products.validation.positive',
        });
      }
    });

    const attributesById = new Map(
      values.attributes.map((attribute, index) => [
        attribute.definitionId,
        { ...attribute, index },
      ]),
    );
    for (const definition of definitions) {
      const attribute = attributesById.get(definition.id);
      const value = attribute?.value ?? '';
      const hasValue = value !== '';
      const path = [
        'attributes',
        attribute?.index ?? definitions.indexOf(definition),
        'value',
      ];

      if (definition.required && !hasValue) {
        context.addIssue({
          code: 'custom',
          path,
          message: 'pages.products.validation.required',
        });
        continue;
      }
      if (!hasValue) continue;

      if (definition.valueType === ProductAttributeValueType.FIXED) {
        if (!definition.options.some((option) => String(option.id) === value)) {
          context.addIssue({
            code: 'custom',
            path,
            message: 'pages.products.validation.invalid-attribute-value',
          });
        }
      } else if (definition.valueType === ProductAttributeValueType.NUMBER) {
        if (!/^-?\d{1,12}(?:\.\d{1,3})?$/.test(value)) {
          context.addIssue({
            code: 'custom',
            path,
            message: 'pages.products.validation.attribute-number',
          });
        }
      } else if (definition.valueType === ProductAttributeValueType.DATE) {
        const date = new Date(`${value}T00:00:00.000Z`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(date.valueOf()) ||
          date.toISOString().slice(0, 10) !== value
        ) {
          context.addIssue({
            code: 'custom',
            path,
            message: 'pages.products.validation.invalid-date',
          });
        }
      } else if (
        definition.valueType === ProductAttributeValueType.BOOLEAN &&
        value !== 'true' &&
        value !== 'false'
      ) {
        context.addIssue({
          code: 'custom',
          path,
          message: 'pages.products.validation.required',
        });
      }
    }
  });
}

const toOptionalNumber = (value: string): number | null =>
  value === '' ? null : Number(value);

export function productFormToRequest(
  values: ProductFormValues,
  definitions: ProductAttributeDefinition[],
): ProductRequest {
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return {
    sku: values.sku,
    ean: values.ean || null,
    name: values.name,
    description: values.description || null,
    brandId: values.brandId ? Number(values.brandId) : null,
    status: values.status,
    units: {
      mainUnitId: Number(values.mainUnitId),
      secondaryUnitId: values.secondaryUnitId
        ? Number(values.secondaryUnitId)
        : null,
      secondaryUnitsPerMainUnit: toOptionalNumber(
        values.secondaryUnitsPerMainUnit,
      ),
    },
    pricing: {
      currencyId: values.currencyId ? Number(values.currencyId) : null,
      netPrice: Number(values.netPrice),
      costPrice: toOptionalNumber(values.costPrice),
      vatRate: Number(values.vatRate),
    },
    dimensions: {
      weight: toOptionalNumber(values.weight),
      width: toOptionalNumber(values.width),
      height: toOptionalNumber(values.height),
      depth: toOptionalNumber(values.depth),
    },
    categoryIds: values.categoryIds.map(Number),
    attributes: values.attributes.flatMap<ProductAttributeValueRequest>(
      ({ definitionId, value }) => {
        if (!value) return [];

        const definition = definitionById.get(definitionId);
        if (!definition) return [];

        switch (definition.valueType) {
        case ProductAttributeValueType.FIXED:
          return [{ definitionId, optionId: Number(value) }];
        case ProductAttributeValueType.NUMBER:
          return [{ definitionId, numberValue: Number(value) }];
        case ProductAttributeValueType.DATE:
          return [{ definitionId, dateValue: value }];
        case ProductAttributeValueType.TEXT:
          return [{ definitionId, textValue: value }];
        case ProductAttributeValueType.BOOLEAN:
          return [{ definitionId, booleanValue: value === 'true' }];
        }
      },
    ),
  };
}
