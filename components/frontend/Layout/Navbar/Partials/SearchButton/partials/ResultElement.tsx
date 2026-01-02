import Link from "next/link";
import { SearchTypeColors, SearchResultItemType } from '@/types/content/SearchTypes';

export interface ResultElementProps {
  item: SearchResultItemType;
  index: number;
}



export function ResultElement({ item }: ResultElementProps) {
  return (
    <Link
      href={item.path}
      className="
        block p-4 rounded-xl 
        bg-base-200/40 backdrop-blur-sm
        hover:bg-base-200/70 transition cursor-pointer
        border border-base-200/30
      "
    >
      <div className="font-semibold text-lg">{item.title}</div>

      {item.description && (
        <div className="text-sm text-gray-400 line-clamp-2">
          {item.description}
        </div>
      )}

      <div className="mt-2">
        {(() => {
          const colorClass = SearchTypeColors[item.type.toUpperCase() as keyof typeof SearchTypeColors];
          return (
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${colorClass}`}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase()}
            </span>
          );
        })()}
      </div>
    </Link>
  );
}
