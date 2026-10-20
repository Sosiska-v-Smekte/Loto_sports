import { useState } from "react";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Field";
import { Modal } from "./ui/Modal";

interface ReasonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
}

export function ReasonModal({ open, onClose, title, description, confirmLabel, danger, loading, onConfirm }: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const error = reason.trim().length < 3 ? "Напишите причину — минимум 3 символа" : undefined;

  const close = () => {
    setReason("");
    setTouched(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Отмена
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={loading}
            onClick={() => {
              setTouched(true);
              if (!error) onConfirm(reason.trim());
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Textarea
        label="Причина"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={touched ? error : undefined}
        hint="Причина будет видна автору"
        rows={3}
        autoFocus
        required
      />
    </Modal>
  );
}
