'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { User } from '@/lib/utils/types';

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSave: (updated: User) => void;
}

export function EditUserDialog({
  open,
  onClose,
  user,
  onSave,
}: EditUserDialogProps) {
  const [form, setForm] = useState<User>(user || ({} as User));

  //need to add enum to value type
  const handleChange = (key: keyof User, value: number | string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        <div className='grid gap-3 py-3'>
          <Input
            value={form.username || ''}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder='Username'
          />
          <Input
            value={form.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder='Email'
          />
          <Input
            value={form.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            placeholder='Role'
          />
        </div>

        <DialogFooter>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
