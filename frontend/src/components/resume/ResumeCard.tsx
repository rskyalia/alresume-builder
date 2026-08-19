'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Globe, Lock } from 'lucide-react';

import type { Resume } from '@/types/resume';
import { formatDate } from '@/lib/utils';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string) => void | Promise<void>;
  onEdit?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeCard({ resume, onDelete, onEdit }: ResumeCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = formatDate(resume.updated_at, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await onDelete(resume.id);
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  }

  return (
    <>
      <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2 leading-snug">
              {resume.title}
            </CardTitle>
            <Badge
              variant={resume.is_public ? 'default' : 'secondary'}
              className="shrink-0 flex items-center gap-1"
            >
              {resume.is_public ? (
                <>
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  <span>Publik</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  <span>Privat</span>
                </>
              )}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            Diperbarui {formattedDate}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex gap-2 pt-0">
          {/* Edit button — delegates to onEdit or falls back to Link */}
          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(resume.id)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Edit
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/resumes/${resume.id}`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Edit
              </Link>
            </Button>
          )}

          {/* Delete button — opens confirmation dialog */}
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => setDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Hapus
          </Button>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Resume</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus resume{' '}
              <span className="font-medium text-foreground">
                &ldquo;{resume.title}&rdquo;
              </span>
              ? Tindakan ini tidak dapat dibatalkan dan semua data terkait akan
              dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Batal
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ResumeCard;
