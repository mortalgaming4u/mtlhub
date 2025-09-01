interface Props {
  novel: {
    title: string;
    total_chapters: number;
    id: number;
  };
}

export default function ChapterPreview({ novel }: Props) {
  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-lg font-semibold">Preview: {novel.title}</h3>
      <p>Total Chapters: {novel.total_chapters}</p>
      <a
        href={`/reader/${novel.id}`}
        className="text-blue-600 underline mt-2 inline-block"
      >
        View Chapters
      </a>
    </div>
  );
}
