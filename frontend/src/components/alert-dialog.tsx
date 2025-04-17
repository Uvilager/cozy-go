import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface CustomAlertDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: string;
  cancelText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConfirmDisabled?: boolean; // Add optional prop
}

export function CustomAlertDialog({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  open,
  onOpenChange,
  isConfirmDisabled = false, // Default to false
}: CustomAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          {/* Add disabled attribute based on the prop */}
          <AlertDialogAction onClick={onConfirm} disabled={isConfirmDisabled}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
