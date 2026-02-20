'use client'
import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload,
  faTrash,
  faSpinner,
  faImage,
  faFolder,
  faCopy,
  faCheck,
  faFilter,
  faSearch,
  faRefresh,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

interface MediaFile {
  key: string
  url: string
  size: number
  lastModified: string
  folder: string
}

interface PaginationData {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MediaLibraryPage() {
  const { t } = useTranslation()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 0,
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedFolder) params.set('folder', selectedFolder)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', pagination.page.toString())
      params.set('pageSize', pagination.pageSize.toString())

      const response = await axiosInstance.get(`/api/media?${params.toString()}`)
      setFiles(response.data.files || [])
      setFolders(response.data.folders || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages,
      }))
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedFolder, debouncedSearch, pagination.page, pagination.pageSize])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }))
      setSelectedFiles(new Set())
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', selectedFolder || 'general')

      await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await fetchFiles()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(t('admin.media.confirm_delete'))) return

    try {
      await axiosInstance.delete('/api/media', { data: { key } })
      await fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return
    if (!confirm(t('admin.media.confirm_bulk_delete', { count: selectedFiles.size }))) return

    try {
      for (const key of selectedFiles) {
        await axiosInstance.delete('/api/media', { data: { key } })
      }
      setSelectedFiles(new Set())
      await fetchFiles()
    } catch (error) {
      console.error('Error deleting files:', error)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const toggleFileSelection = (key: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedFiles(newSelected)
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-base-content">{t('admin.media.title')}</h1>
        <p className="text-base-content/50 text-sm mt-1">{t('admin.media.description')}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-base-200 rounded-lg p-4 border border-base-300">
          <div className="text-2xl font-bold text-base-content">{pagination.total}</div>
          <div className="text-xs text-base-content/50">{t('admin.media.total_files')}</div>
        </div>
        <div className="bg-base-200 rounded-lg p-4 border border-base-300">
          <div className="text-2xl font-bold text-base-content">{formatFileSize(totalSize)}</div>
          <div className="text-xs text-base-content/50">{t('admin.media.page_size')}</div>
        </div>
        <div className="bg-base-200 rounded-lg p-4 border border-base-300">
          <div className="text-2xl font-bold text-base-content">
            {pagination.page} / {pagination.totalPages || 1}
          </div>
          <div className="text-xs text-base-content/50">{t('admin.media.page')}</div>
        </div>
        <div className="bg-base-200 rounded-lg p-4 border border-base-300">
          <div className="text-2xl font-bold text-primary">{selectedFiles.size}</div>
          <div className="text-xs text-base-content/50">{t('admin.media.selected')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between bg-base-200 p-4 rounded-lg border border-base-300">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Upload Button */}
          <label className="btn btn-primary btn-sm gap-2">
            <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} />
            {t('admin.media.upload')}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>

          {/* Folder Filter */}
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-outline btn-sm gap-2">
              <FontAwesomeIcon icon={faFilter} />
              {selectedFolder || t('admin.media.all_folders')}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a onClick={() => setSelectedFolder('')}>{t('admin.media.all_folders')}</a>
              </li>
              {folders.map((folder) => (
                <li key={folder}>
                  <a onClick={() => setSelectedFolder(folder)}>
                    <FontAwesomeIcon icon={faFolder} className="w-3 h-3" />
                    {folder}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Refresh Button */}
          <button className="btn btn-ghost btn-sm" onClick={fetchFiles} disabled={loading}>
            <FontAwesomeIcon icon={faRefresh} spin={loading} />
          </button>

          {/* Bulk Delete */}
          {selectedFiles.size > 0 && (
            <button className="btn btn-error btn-sm gap-2" onClick={handleBulkDelete}>
              <FontAwesomeIcon icon={faTrash} />
              {t('admin.media.delete_selected')} ({selectedFiles.size})
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-base-content/40"
            />
            <input
              type="text"
              placeholder={t('admin.media.search_placeholder')}
              className="input input-bordered input-sm pl-9 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="btn-group">
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg border border-base-300">
          <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-base-content/20 mb-4" />
          <p className="text-base-content/50">{t('admin.media.no_files')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.key}
              className={`group relative bg-base-200 rounded-lg border overflow-hidden transition-all ${
                selectedFiles.has(file.key)
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-base-300 hover:border-primary/50'
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={selectedFiles.has(file.key)}
                  onChange={() => toggleFileSelection(file.key)}
                />
              </div>

              {/* Image */}
              <div className="aspect-square bg-base-300 relative overflow-hidden">
                <img
                  src={file.url}
                  alt={file.key}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    className="btn btn-circle btn-sm btn-ghost text-white"
                    onClick={() => copyToClipboard(file.url)}
                    title={t('admin.media.copy_url')}
                  >
                    <FontAwesomeIcon icon={copiedUrl === file.url ? faCheck : faCopy} />
                  </button>
                  <button
                    className="btn btn-circle btn-sm btn-error"
                    onClick={() => handleDelete(file.key)}
                    title={t('admin.media.delete')}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-base-content/70 truncate" title={file.key}>
                  {file.key.split('/').pop()}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-base-content/40">{formatFileSize(file.size)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-base-content/5 rounded text-base-content/50">
                    {file.folder}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm bg-base-200 rounded-lg">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={() => {
                      if (selectedFiles.size === files.length) {
                        setSelectedFiles(new Set())
                      } else {
                        setSelectedFiles(new Set(files.map((f) => f.key)))
                      }
                    }}
                  />
                </th>
                <th className="w-16">{t('admin.media.preview')}</th>
                <th>{t('admin.media.filename')}</th>
                <th>{t('admin.media.folder')}</th>
                <th>{t('admin.media.size')}</th>
                <th>{t('admin.media.date')}</th>
                <th className="w-24">{t('admin.media.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.key} className="hover">
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={selectedFiles.has(file.key)}
                      onChange={() => toggleFileSelection(file.key)}
                    />
                  </td>
                  <td>
                    <div className="w-12 h-12 rounded overflow-hidden bg-base-300">
                      <img
                        src={file.url}
                        alt={file.key}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </td>
                  <td>
                    <span className="text-sm truncate max-w-[200px] block" title={file.key}>
                      {file.key.split('/').pop()}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-ghost badge-sm">{file.folder}</span>
                  </td>
                  <td className="text-sm text-base-content/70">{formatFileSize(file.size)}</td>
                  <td className="text-sm text-base-content/50">{formatDate(file.lastModified)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => copyToClipboard(file.url)}
                        title={t('admin.media.copy_url')}
                      >
                        <FontAwesomeIcon icon={copiedUrl === file.url ? faCheck : faCopy} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDelete(file.key)}
                        title={t('admin.media.delete')}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            {t('admin.media.previous')}
          </button>

          <div className="join">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  className={`join-item btn btn-sm ${pagination.page === pageNum ? 'btn-active' : ''}`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            className="btn btn-sm btn-outline"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            {t('admin.media.next')}
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  )
}
