'use client'
import { useState, useCallback, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload,
  faTrash,
  faSpinner,
  faCopy,
  faCheck,
  faFolder,
  faFilter,
} from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  useTableContext,
  GridItemRenderProps,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { MediaFile } from '@/types/features/MediaTypes'

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

// Grid Item Component
function MediaGridItem({ item, handleActionClick, actions }: GridItemRenderProps<MediaFile>) {
  const { t } = useTranslation()
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const deleteAction = actions?.find((a) => a.label === 'admin.media.delete')

  return (
    <div className="group relative bg-base-200 rounded-lg border border-base-300 overflow-hidden transition-all hover:border-primary/50">
      {/* Image */}
      <div className="aspect-square bg-base-300 relative overflow-hidden">
        <img
          src={item.url}
          alt={item.key}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            className="btn btn-circle btn-sm btn-ghost text-white"
            onClick={() => copyToClipboard(item.url)}
            title={t('admin.media.copy_url')}
          >
            <FontAwesomeIcon icon={copiedUrl === item.url ? faCheck : faCopy} />
          </button>
          {deleteAction && (
            <button
              className="btn btn-circle btn-sm btn-error"
              onClick={() => handleActionClick(deleteAction, item)}
              title={t('admin.media.delete')}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs text-base-content/70 truncate" title={item.key}>
          {item.key.split('/').pop()}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-base-content/40">{formatFileSize(item.size)}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-base-content/5 rounded text-base-content/50">
            {item.folder}
          </span>
        </div>
      </div>
    </div>
  )
}

// Upload & Filter Toolbar - rendered inside TableHeader
function MediaToolbarContent() {
  const { t } = useTranslation()
  const { refetch } = useTableContext<MediaFile>()
  const [uploading, setUploading] = useState(false)
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState('')

  useEffect(() => {
    axiosInstance.get('/api/media?pageSize=1').then((res) => {
      setFolders(res.data.folders || [])
    })
  }, [])

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

      refetch()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
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
    </>
  )
}

// Image Cell for Table View
function MediaImageCell({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="w-12 h-12 rounded overflow-hidden bg-base-300">
      <img src={url} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  )
}

// Copy URL Cell
function CopyUrlCell({ url }: { url: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className="btn btn-ghost btn-xs"
      onClick={copyToClipboard}
      title={t('admin.media.copy_url')}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
    </button>
  )
}

export default function MediaLibraryPage() {
  const { t } = useTranslation()

  const columns: ColumnDef<MediaFile>[] = [
    {
      key: 'preview',
      header: 'admin.media.preview',
      accessor: (item) => <MediaImageCell url={item.url} alt={item.key} />,
      className: 'w-16',
    },
    {
      key: 'filename',
      header: 'admin.media.filename',
      accessor: (item) => (
        <span className="text-sm truncate max-w-[200px] block" title={item.key}>
          {item.key.split('/').pop()}
        </span>
      ),
    },
    {
      key: 'folder',
      header: 'admin.media.folder',
      accessor: (item) => <span className="badge badge-ghost badge-sm">{item.folder}</span>,
    },
    {
      key: 'size',
      header: 'admin.media.size',
      accessor: (item) => (
        <span className="text-sm text-base-content/70">{formatFileSize(item.size)}</span>
      ),
    },
    {
      key: 'date',
      header: 'admin.media.date',
      accessor: (item) => (
        <span className="text-sm text-base-content/50">{formatDate(item.lastModified)}</span>
      ),
    },
    {
      key: 'copy',
      header: 'admin.media.copy_url',
      accessor: (item) => <CopyUrlCell url={item.url} />,
      className: 'w-16',
    },
  ]

  const handleDelete = useCallback(
    async (item: MediaFile) => {
      if (!confirm(t('admin.media.confirm_delete'))) {
        throw new Error('Cancelled')
      }
      await axiosInstance.delete('/api/media', { data: { key: item.key } })
    },
    [t]
  )

  const actions: ActionButton<MediaFile>[] = [
    {
      label: 'admin.media.delete',
      onClick: handleDelete,
      className: 'btn-error btn-outline',
    },
  ]

  const gridItemRenderer = useCallback(
    (props: GridItemRenderProps<MediaFile>) => <MediaGridItem {...props} />,
    []
  )

  return (
    <div className="w-full">
      <TableProvider<MediaFile>
        apiEndpoint="/api/media"
        dataKey="files"
        idKey="key"
        columns={columns}
        actions={actions}
        pageSize={24}
        defaultViewMode="grid"
        gridItemRenderer={gridItemRenderer}
        gridClassName="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <TableHeader
          title="admin.media.title"
          searchPlaceholder="admin.media.search_placeholder"
          showViewToggle
          showRefresh
          toolbarContent={<MediaToolbarContent />}
          toolbarPosition="before-search"
        />
        <TableBody emptyText="admin.media.no_files" />
        <TableFooter showingText="admin.media.showing" />
      </TableProvider>
    </div>
  )
}
