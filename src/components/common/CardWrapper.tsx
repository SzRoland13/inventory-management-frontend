import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils/css';
import React from 'react';

type Props = {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  cardExtraClass?: string;
  cardHeaderExtraClass?: string;
  cardTitleExtraClass?: string;
  cardDescriptionExtraClass?: string;
  cardContentExtraClass?: string;
};

export default function CardWrapper({
  title,
  description,
  headerAction,
  children,
  cardExtraClass,
  cardHeaderExtraClass,
  cardTitleExtraClass,
  cardDescriptionExtraClass,
  cardContentExtraClass,
}: Props) {
  return (
    <Card
      className={cn('bg-zinc-800 border-zinc-700 shadow-xl', cardExtraClass)}
    >
      <CardHeader
        className={cn(
          'flex flex-row items-start justify-between',
          cardHeaderExtraClass,
        )}
      >
        <div>
          <CardTitle
            className={cn('text-xl text-zinc-100', cardTitleExtraClass)}
          >
            {title}
          </CardTitle>

          {description && (
            <CardDescription
              className={cn('text-zinc-400', cardDescriptionExtraClass)}
            >
              {description}
            </CardDescription>
          )}
        </div>

        {headerAction}
      </CardHeader>

      <CardContent className={cn(cardContentExtraClass)}>
        {children}
      </CardContent>
    </Card>
  );
}
