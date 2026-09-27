import {
  ProductAttributeValueType,
  ProductStatus,
  type ProductAttributeDefinition,
  type ProductResponse,
} from '@/features/products/types/product';
import type { ProductFormValues } from '@/features/products/schemas/productSchemas';

export function valuesFromProduct(
  product: ProductResponse | undefined,
  definitions: ProductAttributeDefinition[],
): ProductFormValues {
  const attributes = new Map(
    (product?.attributes ?? []).map((attribute) => [
      attribute.definitionId,
      attribute,
    ]),
  );

  return {
    sku: product?.sku ?? '',
    ean: product?.ean ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    brandId: product?.brand ? String(product.brand.id) : '',
    status:
      product?.status === ProductStatus.ARCHIVED
        ? ProductStatus.ACTIVE
        : (product?.status ?? ProductStatus.ACTIVE),
    mainUnitId: product ? String(product.units.main.id) : '',
    secondaryUnitId: product?.units.secondary
      ? String(product.units.secondary.id)
      : '',
    secondaryUnitsPerMainUnit:
      product?.units.secondaryUnitsPerMainUnit == null
        ? ''
        : String(product.units.secondaryUnitsPerMainUnit),
    currencyId:
      product?.pricing.currencyId == null
        ? ''
        : String(product.pricing.currencyId),
    netPrice: product ? String(product.pricing.netPrice) : '',
    costPrice:
      product?.pricing.costPrice == null
        ? ''
        : String(product.pricing.costPrice),
    vatRate: product ? String(product.pricing.vatRate) : '',
    weight:
      product?.dimensions.weight == null
        ? ''
        : String(product.dimensions.weight),
    width:
      product?.dimensions.width == null ? '' : String(product.dimensions.width),
    height:
      product?.dimensions.height == null
        ? ''
        : String(product.dimensions.height),
    depth:
      product?.dimensions.depth == null ? '' : String(product.dimensions.depth),
    categoryIds: (product?.categoryIds ?? []).map(String),
    attributes: definitions.map((definition) => {
      const attribute = attributes.get(definition.id);
      let value = '';
      switch (definition.valueType) {
        case ProductAttributeValueType.FIXED:
          value = attribute?.optionId == null ? '' : String(attribute.optionId);
          break;
        case ProductAttributeValueType.NUMBER:
          value =
            attribute?.numberValue == null ? '' : String(attribute.numberValue);
          break;
        case ProductAttributeValueType.DATE:
          value = attribute?.dateValue ?? '';
          break;
        case ProductAttributeValueType.TEXT:
          value = attribute?.textValue ?? '';
          break;
        case ProductAttributeValueType.BOOLEAN:
          value =
            attribute?.booleanValue == null
              ? ''
              : String(attribute.booleanValue);
          break;
      }
      return { definitionId: definition.id, value };
    }),
  };
}
