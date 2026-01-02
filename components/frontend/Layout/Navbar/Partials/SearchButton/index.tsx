"use client";

import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faB, faMagnifyingGlass, faP, faSpinner } from "@fortawesome/free-solid-svg-icons"; // Spinner ekledik
import HeadlessModal, { useModal } from "@/components/common/Layout/Modal";
import { ResultElement } from "./partials/ResultElement";
import { SearchResultItemType, SearchType } from '@/types/content/SearchTypes';
import axiosInstance from "@/libs/axios";

const SearchButton = () => {
  const { open, openModal, closeModal } = useModal(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResultItemType[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTypes] = useState<SearchType[]>([
    SearchType.BLOG,
    SearchType.PROJECT,
  ]);

  const toggleSearchType = (type: SearchType) => {
    if (searchTypes.includes(type)) {
      const index = searchTypes.indexOf(type);
      searchTypes.splice(index, 1);
    } else {
      searchTypes.push(type);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  // AbortController ref'i (Eski istekleri iptal etmek için)
  const abortControllerRef = useRef<AbortController | null>(null);

  /** Debounce Search & Cleanup */
  useEffect(() => {
    // Input boşsa sonuçları temizle ve bekleme
    if (searchQuery.trim().length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    const t = setTimeout(() => {
      search(searchQuery);
    }, 250);

    return () => {
      clearTimeout(t);
    };
  }, [searchQuery, searchTypes]);

  const search = async (q: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    await axiosInstance
      .get("/api/search" + `?q=${encodeURIComponent(q)}`)
      .then((response) => {
        const data = response.data;

        // TIP FİLTRESİ — yalnızca seçili kategorilerde olanlar gelsin
        const filteredResults = data.hits.filter(
          (hit: SearchResultItemType) => searchTypes.includes(hit.type)
        );

        setResults(filteredResults);
      })
      .catch((error) => {
        console.error("Search error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };


  return (
    <>
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
      >
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          style={{ width: 24, height: 24 }}
        />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        showClose={true}
        title="Search"
        className="backdrop-blur-xl border border-base-200"
      >
        {/* Input Wrapper - Loading ikonunu buraya koyuyoruz */}
        <div className="relative w-full mb-4">
          <input
            ref={inputRef}
            type="text"
            className="
              input input-bordered w-full h-12 text-base px-4 pr-10
              backdrop-blur-md
              border rounded-xl
            "
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Loading İkonu: Input'un sağ tarafında, layout'u itmez */}
          {false && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} spin />
            </div>
          )}

          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <button
              onClick={() => {
                toggleSearchType(SearchType.BLOG);
                search(searchQuery); // Tür değiştiğinde aramayı tetikle
              }}
              className={`mr-2 px-2 py-1 rounded-full text-sm border ${searchTypes.includes(SearchType.BLOG)
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-gray-500 border-gray-300"
                }`}
            >
              <FontAwesomeIcon icon={faB} />
            </button>
            <button
              onClick={() => {
                toggleSearchType(SearchType.PROJECT);
                search(searchQuery); // Tür değiştiğinde aramayı tetikle
              }}
              className={`px-2 py-1 rounded-full text-sm border ${searchTypes.includes(SearchType.PROJECT)
                  ? "bg-primary text-white border-primary"
                  : "bg-transparent text-gray-500 border-gray-300"
                }`}
            >
              <FontAwesomeIcon icon={faP} />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className={`max-h-[60vh] overflow-y-auto space-y-2 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>

          {/* "Sonuç bulunamadı" sadece loading değilken ve query varken gösterilir */}
          {!loading && results.length === 0 && searchQuery.length > 0 && (
            <div className="text-gray-500 px-1 text-sm italic">
              No results found.
            </div>
          )}

          {results.map((item, i) => (
            <ResultElement key={i} item={item} index={i} />
          ))}
        </div>
      </HeadlessModal>
    </>
  );
};

export default SearchButton;