import { AvatarUploader } from "./AvatarUploader";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

interface AvatarModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  name: string;
  id: number;
  src: string | null | undefined;
  onUpload: (image: string) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}

/** Окно смены аватарки (для сообщества). Изменение сохраняется сразу после выбора файла. */
export function AvatarModal({ open, onClose, title, ...uploader }: AvatarModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<Button onClick={onClose}>Готово</Button>}>
      <AvatarUploader {...uploader} />
    </Modal>
  );
}
