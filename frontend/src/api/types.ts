export type Photo = {
    id: number;
    title: string;
    description: string;
    category: string;
    price: number;
    file_path: string;
    thumb_path: string | null;    // <-- dodaj to, jeśli jeszcze nie było
    owner_id: number;
    owner_username?: string;
  };
  