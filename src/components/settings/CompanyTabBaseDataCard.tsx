import { useForm } from 'react-hook-form';
import { CompanyService } from '@/lib/services/CompanyService';
import {
  CompanyBaseDataUpdateRequest,
  CompanyExtendedResponse,
} from '@/lib/services/dtos/companyDtos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useCompanyStore } from '@/lib/stores/companyStore';

type Props = {
  initialCompanyData?: CompanyExtendedResponse;
};

export default function CompanyTabBaseDataCard({ initialCompanyData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<CompanyBaseDataUpdateRequest>({
    defaultValues: {
      name: initialCompanyData?.name,
      description: initialCompanyData?.description,
      email: initialCompanyData?.email,
      phone: initialCompanyData?.phone,
      address: initialCompanyData?.address,
      website: initialCompanyData?.website,
    },
  });

  const t = useTranslations();
  const setCompanyData = useCompanyStore((state) => state.setCompanyData);

  const onSubmit = async (data: CompanyBaseDataUpdateRequest) => {
    const res = await CompanyService.updateCompanyBaseData(data);

    if (res.success && res.payload) {
      setCompanyData({
        name: res.payload.name,
      });
      reset(res.payload);
      toast(t(`messageKey.${res.messageKey}`));
    }
  };

  return (
    <Card className='bg-zinc-800 border-zinc-700 shadow-xl'>
      <CardHeader>
        <CardTitle className='text-xl text-zinc-100'>
          {t('pages.settings.tabs.company.data.title')}
        </CardTitle>

        <CardDescription className='text-zinc-400'>
          {t('pages.settings.tabs.company.data.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.data.fields.name')}
            </Label>
            <Input
              {...register('name')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.data.fields.description')}
            </Label>
            <Input
              {...register('description')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.data.fields.email')}
            </Label>
            <Input
              {...register('email')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.data.fields.phone')}
            </Label>
            <Input
              {...register('phone')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.data.fields.address')}
            </Label>
            <Input
              {...register('address')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label className='text-zinc-400'>
              {t('pages.settings.tabs.company.data.fields.website')}
            </Label>
            <Input
              {...register('website')}
              className='bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400'
            />
          </div>

          <Button
            type='submit'
            disabled={!isDirty || isSubmitting}
            className='bg-zinc-500 mt-2'
          >
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
