

export default function PhotoCard({ photo, onClick }) {
  const fileUrl  = `/photos/${photo.id}/file`;
  const thumbUrl = photo.thumb_path
        ? `/photos/${photo.thumb_path.replace(/\\/g, "/")}`   // Windows \ -> /
        : "/placeholder.png";

  return (
    <div onClick={onClick} className="cursor-pointer">
      <img src={thumbUrl} alt={photo.title} className="w-full rounded" />
      <h3 className="mt-2 font-medium">{photo.title}</h3>
    </div>
  );
}